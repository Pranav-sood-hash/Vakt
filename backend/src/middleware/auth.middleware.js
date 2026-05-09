const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response.utils');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'UNAUTHORIZED', 'Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return errorResponse(res, 'INVALID_TOKEN', 'Token is invalid or expired', 401);
  }
};
