/**
 * Async Handler Wrapper
 * Eliminates repetitive try/catch boilerplate in Express route controllers.
 * Passes uncaught exceptions directly to the global error middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

