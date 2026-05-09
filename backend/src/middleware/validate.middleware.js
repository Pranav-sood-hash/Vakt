const { errorResponse } = require('../utils/response.utils');

module.exports = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    return errorResponse(res, error.errors, 'Validation Error', 400);
  }
};
