const successResponse = (res, statusCode, data, message) => {
  res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

const errorResponse = (res, statusCode, message, errors = null) => {
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    timestamp: new Date().toISOString(),
  });
};

module.exports = { successResponse, errorResponse };