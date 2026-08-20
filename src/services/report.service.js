const prisma = require('../config/prisma');
const { getPagination } = require('../utils/pagination');

class ReportService {
  /**
   * Create a report
   */
  static async createReport(data) {
    // Check if user is reporting themselves
    if (data.reporterUserId === data.reportedUserId) {
      throw new Error('CANNOT_REPORT_SELF');
    }

    // Check if report already exists
    const existingReport = await prisma.report.findFirst({
      where: {
        reporter_user_id: data.reporterUserId,
        reported_user_id: data.reportedUserId,
        report_status: { in: ['PENDING', 'REVIEWING'] },
        deleted_at: null,
      },
    });

    if (existingReport) {
      throw new Error('ALREADY_REPORTED');
    }

    const report = await prisma.report.create({
      data: {
        reporter_user_id: data.reporterUserId,
        reported_user_id: data.reportedUserId,
        product_id: data.productId ? Number(data.productId) : null,
        report_type: data.reportType,
        description: data.description,
        report_status: 'PENDING',
      },
      include: {
        reporter: {
          select: {
            user_id: true,
            full_name: true,
          },
        },
        reported: {
          select: {
            user_id: true,
            full_name: true,
          },
        },
        product: {
          select: {
            product_id: true,
            title: true,
          },
        },
      },
    });

    // Create notification for admins (can be expanded later)
    // For now, just log it
    console.log(`📢 New report created: ${report.report_id} - ${report.report_type}`);

    return report;
  }

  /**
   * Get all reports (admin only)
   */
  static async getAllReports(filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const { skip, take } = getPagination(page, limit);

    const where = {
      deleted_at: null,
    };

    if (filters.status) {
      where.report_status = filters.status;
    }

    if (filters.reportType) {
      where.report_type = filters.reportType;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: {
              user_id: true,
              full_name: true,
              phone_number: true,
            },
          },
          reported: {
            select: {
              user_id: true,
              full_name: true,
              phone_number: true,
            },
          },
          product: {
            select: {
              product_id: true,
              title: true,
            },
          },
          resolver: {
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
      prisma.report.count({ where }),
    ]);

    return { reports, total, page, limit };
  }

  /**
   * Get report by ID (admin only)
   */
  static async getReportById(reportId) {
    const report = await prisma.report.findFirst({
      where: {
        report_id: Number(reportId),
        deleted_at: null,
      },
      include: {
        reporter: {
          select: {
            user_id: true,
            full_name: true,
            phone_number: true,
          },
        },
        reported: {
          select: {
            user_id: true,
            full_name: true,
            phone_number: true,
          },
        },
        product: {
          select: {
            product_id: true,
            title: true,
            description: true,
          },
        },
        resolver: {
          select: {
            user_id: true,
            full_name: true,
          },
        },
      },
    });

    if (!report) {
      throw new Error('REPORT_NOT_FOUND');
    }

    return report;
  }

  /**
   * Update report status (admin only)
   */
  static async updateReportStatus(reportId, adminId, status, response) {
    const report = await prisma.report.findFirst({
      where: {
        report_id: Number(reportId),
        deleted_at: null,
      },
    });

    if (!report) {
      throw new Error('REPORT_NOT_FOUND');
    }

    const validStatuses = ['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED'];
    if (!validStatuses.includes(status)) {
      throw new Error('INVALID_STATUS');
    }

    const updateData = {
      report_status: status,
      admin_response: response,
    };

    if (status === 'RESOLVED' || status === 'DISMISSED') {
      updateData.resolved_at = new Date();
      updateData.resolved_by = adminId;

      // If report is resolved, take action on reported user
      if (status === 'RESOLVED') {
        // Log the action - actual implementation would depend on business rules
        console.log(`✅ Report ${reportId} resolved by admin ${adminId}`);
      }
    }

    const updatedReport = await prisma.report.update({
      where: { report_id: Number(reportId) },
      data: updateData,
      include: {
        reporter: {
          select: {
            user_id: true,
            full_name: true,
          },
        },
        reported: {
          select: {
            user_id: true,
            full_name: true,
          },
        },
        resolver: {
          select: {
            user_id: true,
            full_name: true,
          },
        },
      },
    });

    // Create notification for reporter
    await prisma.notification.create({
      data: {
        user_id: report.reporter_user_id,
        notification_type: 'REPORT_UPDATE',
        related_entity_type: 'REPORT',
        related_entity_id: reportId,
        message: `Your report has been ${status.toLowerCase()}`,
      },
    });

    return updatedReport;
  }

  /**
   * Delete report (admin only)
   */
  static async deleteReport(reportId) {
    const report = await prisma.report.findFirst({
      where: {
        report_id: Number(reportId),
        deleted_at: null,
      },
    });

    if (!report) {
      throw new Error('REPORT_NOT_FOUND');
    }

    await prisma.report.update({
      where: { report_id: Number(reportId) },
      data: { deleted_at: new Date() },
    });

    return { message: 'Report deleted successfully' };
  }

  /**
   * Get reports by user
   */
  static async getUserReports(userId, filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const { skip, take } = getPagination(page, limit);

    const where = {
      reporter_user_id: userId,
      deleted_at: null,
    };

    if (filters.status) {
      where.report_status = filters.status;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reported: {
            select: {
              user_id: true,
              full_name: true,
            },
          },
          product: {
            select: {
              product_id: true,
              title: true,
            },
          },
          resolver: {
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
      prisma.report.count({ where }),
    ]);

    return { reports, total, page, limit };
  }
}

module.exports = ReportService;