"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ServiceController_1 = require("../controllers/ServiceController");
const router = (0, express_1.Router)();
// Get all active services
router.get('/', ServiceController_1.ServiceController.getServices);
// Get service by ID
router.get('/:serviceId', ServiceController_1.ServiceController.getService);
exports.default = router;
