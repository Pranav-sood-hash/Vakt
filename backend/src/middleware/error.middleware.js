const { errorResponse } = require('../utils/response.utils');

module.exports = (err, req, res, next) => {
  console.error(err);
  
  if (err.name === 'ZodError') {
    return errorResponse(res, err.errors, 'Validation Error', 400);
  }
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  errorResponse(res, err.name || 'SERVER_ERROR', message, statusCode);
};
