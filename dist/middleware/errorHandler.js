"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const response_1 = require("../views/response");
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    if (err.type === 'entity.parse.failed') {
        return response_1.ApiResponse.error(res, 'Invalid JSON in request body', 400);
    }
    if (err.name === 'ValidationError') {
        return response_1.ApiResponse.error(res, 'Validation error', 400, err.errors);
    }
    return response_1.ApiResponse.error(res, err.message || 'Internal server error', err.statusCode || 500);
};
exports.errorHandler = errorHandler;
