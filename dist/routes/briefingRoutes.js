"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BriefingController_1 = require("../controllers/BriefingController");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Get briefing
router.get('/:projectId', validation_1.validateProjectId, BriefingController_1.BriefingController.getBriefing);
// Submit briefing
router.post('/:projectId/submit', validation_1.validateProjectId, validation_1.validateBriefing, BriefingController_1.BriefingController.submitBriefing);
exports.default = router;
