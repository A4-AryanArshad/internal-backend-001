"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBriefing = exports.validateServiceSelection = exports.validateProjectId = void 0;
const response_1 = require("../views/response");
const validateProjectId = (req, res, next) => {
    const { projectId } = req.params;
    if (!projectId || typeof projectId !== 'string') {
        return response_1.ApiResponse.error(res, 'Invalid project ID', 400);
    }
    next();
};
exports.validateProjectId = validateProjectId;
const validateServiceSelection = (req, res, next) => {
    const { serviceId, customAmount } = req.body;
    if (!serviceId && !customAmount) {
        return response_1.ApiResponse.error(res, 'Either serviceId or customAmount must be provided', 400);
    }
    if (customAmount && (isNaN(customAmount) || customAmount <= 0)) {
        return response_1.ApiResponse.error(res, 'Custom amount must be a positive number', 400);
    }
    next();
};
exports.validateServiceSelection = validateServiceSelection;
const validateBriefing = (req, res, next) => {
    const { overall_description, images } = req.body;
    if (!overall_description || overall_description.trim().length === 0) {
        return response_1.ApiResponse.error(res, 'Overall description is required', 400);
    }
    if (!images || !Array.isArray(images) || images.length === 0) {
        return response_1.ApiResponse.error(res, 'At least one image is required', 400);
    }
    next();
};
exports.validateBriefing = validateBriefing;
