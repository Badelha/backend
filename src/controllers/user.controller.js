const UserService = require('../services/user.service');
const { successResponse, errorResponse } = require('../utils/response');

class UserController {
  static async getAllUsers(req, res) {
    try {
      const result = await UserService.getAllUsers(req.query);
      successResponse(res, 200, result, 'Users retrieved successfully');
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  static async getUserById(req, res) {
    try {
      const user = await UserService.getUserById(Number(req.params.id));
      successResponse(res, 200, user, 'User retrieved successfully');
    } catch (error) {
      const errorMap = {
        'USER_NOT_FOUND': { status: 404, message: 'User not found' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 500, error.message);
    }
  }

  static async updateProfile(req, res) {
    try {
      const user = await UserService.updateProfile(req.user.user_id, req.body);
      successResponse(res, 200, user, 'Profile updated successfully');
    } catch (error) {
      const errorMap = {
        'USER_NOT_FOUND': { status: 404, message: 'User not found' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 400, error.message);
    }
  }

  static async updateUserStatus(req, res) {
    try {
      const { status } = req.body;
      const user = await UserService.updateUserStatus(Number(req.params.id), status);
      successResponse(res, 200, user, 'User status updated successfully');
    } catch (error) {
      const errorMap = {
        'USER_NOT_FOUND': { status: 404, message: 'User not found' },
        'INVALID_STATUS': { status: 400, message: 'Invalid status value' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 500, error.message);
    }
  }

  static async deleteUser(req, res) {
    try {
      const result = await UserService.deleteUser(Number(req.params.id));
      successResponse(res, 200, result, 'User deleted successfully');
    } catch (error) {
      const errorMap = {
        'USER_NOT_FOUND': { status: 404, message: 'User not found' },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return errorResponse(res, mapped.status, mapped.message);
      }
      errorResponse(res, 500, error.message);
    }
  }
}

module.exports = UserController;