class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;

        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends ErrorHandler {
    constructor(message) {
        super(message || "Resource not found", 404);
    }
}

module.exports = { ErrorHandler, NotFoundError };

