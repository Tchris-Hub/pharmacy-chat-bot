/**
 * Validation middleware factory
 * Creates middleware to validate request data against Zod schema
 */
function validate(schema, property = 'body') {
    return (req, res, next) => {
        const result = schema.safeParse(req[property]);

        if (!result.success) {
            const errors = result.error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
            }));

            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors,
            });
        }

        // Replace request data with validated data
        req[property] = result.data;
        next();
    };
}

module.exports = validate;
