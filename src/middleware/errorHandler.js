/**
 * Global error handler middleware
 * Catches all errors and formats consistent error responses
 */
function errorHandler(err, req, res, next) {
    console.error('Error:', err);

    // Default error
    let status = 500;
    let message = 'Internal server error';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        status = 400;
        message = err.message;
    } else if (err.name === 'UnauthorizedError') {
        status = 401;
        message = 'Unauthorized';
    } else if (err.status) {
        status = err.status;
        message = err.message;
    }

    // Don't leak error details in production
    const response = {
        success: false,
        error: message,
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    res.status(status).json(response);
}

module.exports = errorHandler;
