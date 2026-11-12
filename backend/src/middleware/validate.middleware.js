/**
 * Zod Schema Validation Middleware
 * Validates req.body, req.query, or req.params against a Zod schema.
 */
const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    // Replace request data with sanitized / transformed values
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validate;

