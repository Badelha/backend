const CityService = require('../services/city.service');
const { successResponse, errorResponse } = require('../utils/response');

class CityController {
  static async listCities(req, res) {
    try {
      const cities = await CityService.listCities();
      successResponse(res, 200, { cities }, 'Gaza regions retrieved successfully');
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }
}

module.exports = CityController;
