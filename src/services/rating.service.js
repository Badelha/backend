const prisma = require('../config/prisma');
const { getPagination } = require('../utils/pagination');

class RatingService {
  /**
   * Create a rating
   */
  static async createRating(data) {
    // Check if user is trying to rate themselves
    if (data.raterUserId === data.ratedUserId) {
      throw new Error('CANNOT_RATE_SELF');
    }

    // Check if rating already exists
    const existingRating = await prisma.rating.findFirst({
      where: {
        rated_entity_type: data.entityType,
        entity_id: Number(data.entityId),
        rater_user_id: data.raterUserId,
        rated_user_id: data.ratedUserId,
        deleted_at: null,
      },
    });

    if (existingRating) {
      throw new Error('ALREADY_RATED');
    }

    // Validate the transaction exists and is completed
    let transaction = null;
    if (data.entityType === 'EXCHANGE') {
      transaction = await prisma.exchangeRequest.findFirst({
        where: {
          exchange_request_id: Number(data.entityId),
          request_status: 'COMPLETED',
          deleted_at: null,
          OR: [
            { initiator_user_id: data.raterUserId },
            { target_user_id: data.raterUserId },
          ],
        },
      });
    } else {
      transaction = await prisma.purchaseRequest.findFirst({
        where: {
          purchase_request_id: Number(data.entityId),
          request_status: 'COMPLETED',
          deleted_at: null,
          OR: [
            { initiator_user_id: data.raterUserId },
            { target_user_id: data.raterUserId },
          ],
        },
      });
    }

    if (!transaction) {
      throw new Error('TRANSACTION_NOT_FOUND');
    }

    const rating = await prisma.rating.create({
      data: {
        rated_entity_type: data.entityType,
        entity_id: Number(data.entityId),
        rater_user_id: data.raterUserId,
        rated_user_id: data.ratedUserId,
        rating_score: data.score,
        review: data.review,
      },
      include: {
        rater: {
          select: {
            user_id: true,
            full_name: true,
          },
        },
        rated: {
          select: {
            user_id: true,
            full_name: true,
          },
        },
      },
    });

    // Create notification for rated user
    await prisma.notification.create({
      data: {
        user_id: data.ratedUserId,
        notification_type: 'RATING',
        related_entity_type: 'RATING',
        related_entity_id: rating.rating_id,
        message: `You received a ${data.score}-star rating`,
      },
    });

    return rating;
  }

  /**
   * Get ratings for a user
   */
  static async getUserRatings(userId, filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const { skip, take } = getPagination(page, limit);

    const where = {
      rated_user_id: userId,
      deleted_at: null,
    };

    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
        where,
        include: {
          rater: {
            select: {
              user_id: true,
              full_name: true,
            },
          },
        },
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      prisma.rating.count({ where }),
    ]);

    // Get average rating
    const avgRating = await prisma.rating.aggregate({
      where: {
        rated_user_id: userId,
        deleted_at: null,
      },
      _avg: {
        rating_score: true,
      },
    });

    return {
      ratings,
      total,
      page,
      limit,
      average_rating: avgRating._avg.rating_score || 0,
      total_ratings: total,
    };
  }

  /**
   * Get rating by ID
   */
  static async getRatingById(ratingId) {
    const rating = await prisma.rating.findFirst({
      where: {
        rating_id: Number(ratingId),
        deleted_at: null,
      },
      include: {
        rater: {
          select: {
            user_id: true,
            full_name: true,
          },
        },
        rated: {
          select: {
            user_id: true,
            full_name: true,
          },
        },
      },
    });

    if (!rating) {
      throw new Error('RATING_NOT_FOUND');
    }

    return rating;
  }

  /**
   * Update a rating
   */
  static async updateRating(ratingId, userId, data) {
    const rating = await prisma.rating.findFirst({
      where: {
        rating_id: Number(ratingId),
        rater_user_id: userId,
        deleted_at: null,
      },
    });

    if (!rating) {
      throw new Error('RATING_NOT_FOUND');
    }

    const updateData = {};
    if (data.score) updateData.rating_score = data.score;
    if (data.review !== undefined) updateData.review = data.review;

    const updatedRating = await prisma.rating.update({
      where: { rating_id: Number(ratingId) },
      data: updateData,
      include: {
        rater: {
          select: {
            user_id: true,
            full_name: true,
          },
        },
        rated: {
          select: {
            user_id: true,
            full_name: true,
          },
        },
      },
    });

    return updatedRating;
  }

  /**
   * Delete a rating
   */
  static async deleteRating(ratingId, userId) {
    const rating = await prisma.rating.findFirst({
      where: {
        rating_id: Number(ratingId),
        rater_user_id: userId,
        deleted_at: null,
      },
    });

    if (!rating) {
      throw new Error('RATING_NOT_FOUND');
    }

    await prisma.rating.update({
      where: { rating_id: Number(ratingId) },
      data: { deleted_at: new Date() },
    });

    return { message: 'Rating deleted successfully' };
  }
}

module.exports = RatingService;