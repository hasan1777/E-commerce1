const { NotFoundError, ErrorHandler } = require("../utils/errorHandler.js"); // Assuming errorHandler.js will be created

// Middleware to handle 404 Not Found errors
const notFound = (req, res, next) => {
    const error = new NotFoundError(`Not Found - ${req.originalUrl}`);
    next(error);
};

// Middleware to handle all other errors
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log to console for dev
    console.error("---- ERROR ----".red.bold);
    console.error(err.stack ? err.stack.red : err.toString().red);
    console.error("---- END ERROR ----".red.bold);

    // Mongoose bad ObjectId
    if (err.name === "CastError" && err.kind === "ObjectId") {
        const message = `Resource not found with id of ${err.value}`;
        error = new NotFoundError(message);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `Duplicate field value entered for '${field}'. Please use another value.`;
        error = new ErrorHandler(message, 400);
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors).map(val => val.message);
        const message = messages.join(". ");
        error = new ErrorHandler(message, 400);
    }
    
    // JWT errors
    if (err.name === "JsonWebTokenError") {
        const message = "JSON Web Token is invalid, try again";
        error = new ErrorHandler(message, 401);
    }
    if (err.name === "TokenExpiredError") {
        const message = "JSON Web Token is expired, try again";
        error = new ErrorHandler(message, 401);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Server Error",
        // Optionally include stack in development
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
};

module.exports = { notFound, errorHandler };

