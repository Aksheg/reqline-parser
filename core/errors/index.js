const ERROR_CODE = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

function throwAppError(message, errorCode = ERROR_CODE.INTERNAL_ERROR) {
  const error = new Error(message);
  error.code = errorCode;
  throw error;
}

module.exports = {
  throwAppError,
  ERROR_CODE
};