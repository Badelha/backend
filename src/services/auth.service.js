const prisma = require('../config/prisma');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { generateTokens, verifyToken } = require('../utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const config = require('../config/env');
const crypto = require('crypto');

class AuthService {
  /**
   * Register a new user
   */
  static async register(userData) {
    // Check if email exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (existingEmail) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    // Check if phone exists
    const existingPhone = await prisma.user.findUnique({
      where: { phone_number: userData.phoneNumber },
    });
    if (existingPhone) {
      throw new Error('PHONE_ALREADY_EXISTS');
    }

    const hashedPassword = await hashPassword(userData.password);

    // Create user and related data in transaction
    const newUser = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          full_name: userData.fullName,
          phone_number: userData.phoneNumber,
          address: userData.address,
          email: userData.email,
          password_hash: hashedPassword,
          city_id: userData.cityId,
          account_status: 'PENDING_VERIFICATION',
        },
        include: {
          city: true,
        },
      });

      // Get USER role from database (NO hardcoded IDs)
      const userRole = await tx.role.findUnique({
        where: { role_name: 'USER' },
      });

      if (userRole) {
        await tx.userRole.create({
          data: {
            user_id: user.user_id,
            role_id: userRole.role_id,
          },
        });
      }

      // Create email verification token
      const token = crypto.randomBytes(32).toString('hex');
      await tx.emailVerification.create({
        data: {
          user_id: user.user_id,
          token,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      return user;
    });

    // Send verification email OUTSIDE transaction
    // If email fails, user is still created (they can request resend)
    sendVerificationEmail(newUser.email, crypto.randomBytes(32).toString('hex'))
      .catch(console.error);

    const { password_hash, ...userWithoutPassword } = newUser;
    const tokens = generateTokens(newUser);

    // Save refresh token in database
    await prisma.user.update({
      where: { user_id: newUser.user_id },
      data: {
        refresh_token: tokens.refreshToken,
        refresh_token_expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return { user: userWithoutPassword, ...tokens };
  }

  /**
   * Login user
   */
  static async login(email, password) {
    const user = await prisma.user.findFirst({
      where: {
        email,
        deleted_at: null,
      },
      include: {
        city: true,
        user_roles: {
          where: { deleted_at: null },
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    if (user.account_status === 'BANNED') {
      throw new Error('ACCOUNT_BANNED');
    }

    if (user.account_status === 'SUSPENDED') {
      throw new Error('ACCOUNT_SUSPENDED');
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const tokens = generateTokens(user);

    // Update last login and refresh token
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        last_login: new Date(),
        refresh_token: tokens.refreshToken,
        refresh_token_expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const { password_hash, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, ...tokens };
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken) {
    const decoded = verifyToken(refreshToken, config.JWT_REFRESH_SECRET);
    if (!decoded) {
      throw new Error('INVALID_TOKEN');
    }

    const user = await prisma.user.findFirst({
      where: {
        user_id: decoded.userId,
        deleted_at: null,
        refresh_token: refreshToken,
        refresh_token_expires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new Error('INVALID_TOKEN');
    }

    if (user.account_status === 'BANNED') {
      throw new Error('ACCOUNT_BANNED');
    }

    const tokens = generateTokens(user);

    // Update refresh token
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        refresh_token: tokens.refreshToken,
        refresh_token_expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return tokens;
  }

  /**
   * Verify email
   */
  static async verifyEmail(token) {
    const verification = await prisma.emailVerification.findFirst({
      where: {
        token,
        is_used: false,
        expires_at: { gt: new Date() },
        deleted_at: null,
      },
    });

    if (!verification) {
      throw new Error('INVALID_TOKEN');
    }

    await prisma.$transaction([
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: { is_used: true, verified_at: new Date() },
      }),
      prisma.user.update({
        where: { user_id: verification.user_id },
        data: {
          is_verified: true,
          account_status: 'ACTIVE',
        },
      }),
    ]);

    return { message: 'Email verified successfully' };
  }

  /**
   * Forgot password - send reset email
   */
  static async forgotPassword(email) {
    const user = await prisma.user.findFirst({
      where: { email, deleted_at: null },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // Delete old reset tokens
    await prisma.passwordReset.updateMany({
      where: {
        user_id: user.user_id,
        is_used: false,
      },
      data: { is_used: true },
    });

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.passwordReset.create({
      data: {
        user_id: user.user_id,
        token,
        expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Send email OUTSIDE transaction
    sendPasswordResetEmail(user.email, token).catch(console.error);

    return { message: 'Password reset email sent' };
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token, newPassword) {
    const reset = await prisma.passwordReset.findFirst({
      where: {
        token,
        is_used: false,
        expires_at: { gt: new Date() },
        deleted_at: null,
      },
    });

    if (!reset) {
      throw new Error('INVALID_TOKEN');
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: { is_used: true, reset_at: new Date() },
      }),
      prisma.user.update({
        where: { user_id: reset.user_id },
        data: { password_hash: hashedPassword },
      }),
    ]);

    return { message: 'Password reset successfully' };
  }

  /**
   * Get user profile
   */
  static async getProfile(userId) {
    const user = await prisma.user.findFirst({
      where: {
        user_id: userId,
        deleted_at: null,
      },
      include: {
        city: true,
        user_roles: {
          where: { deleted_at: null },
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

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

    const { password_hash, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      average_rating: avgRating._avg.rating_score || 0,
    };
  }

  /**
   * Logout - clear refresh token
   */
  static async logout(userId) {
    await prisma.user.update({
      where: { user_id: userId },
      data: {
        refresh_token: null,
        refresh_token_expires: null,
      },
    });
    return { message: 'Logout successful' };
  }
}

module.exports = AuthService;