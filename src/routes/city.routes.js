const express = require('express');
const router = express.Router();
const CityController = require('../controllers/city.controller');

/**
 * @route   GET /api/cities
 * @desc    List Gaza regions for the city dropdown
 * @access  Public
 */
router.get('/', CityController.listCities);

module.exports = router;
