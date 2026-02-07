"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    static success(res, data, message, statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message: message || 'Operation successful',
            data,
        });
    }
    static error(res, message, statusCode = 400, errors) {
        return res.status(statusCode).json({
            success: false,
            message,
            errors: errors || undefined,
        });
    }
    static notFound(res, message = 'Resource not found') {
        return res.status(404).json({
            success: false,
            message,
        });
    }
    static unauthorized(res, message = 'Unauthorized access') {
        return res.status(401).json({
            success: false,
            message,
        });
    }
}
exports.ApiResponse = ApiResponse;
