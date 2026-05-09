exports.successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

exports.errorResponse = (res, error, message = 'Error', statusCode = 500) => {
  return res.status(statusCode).json({ success: false, message, error });
};

exports.paginatedResponse = (res, data, page, limit, total, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: { page, limit, total, totalPages }
  });
};
