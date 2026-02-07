"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CustomQuoteController_1 = require("../controllers/CustomQuoteController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Client routes (authenticated)
router.post('/request', auth_1.authenticate, CustomQuoteController_1.CustomQuoteController.requestStandaloneQuote); // Standalone request from dashboard
router.post('/:projectId/request', auth_1.authenticate, validation_1.validateProjectId, CustomQuoteController_1.CustomQuoteController.requestCustomQuote);
router.get('/:projectId', auth_1.optionalAuth, validation_1.validateProjectId, CustomQuoteController_1.CustomQuoteController.getCustomQuote);
router.post('/:quoteId/accept', auth_1.authenticate, CustomQuoteController_1.CustomQuoteController.acceptCustomQuote);
// Admin routes
router.post('/:quoteId/create-project', CustomQuoteController_1.CustomQuoteController.createProjectFromQuote); // Create project from quote
router.post('/:quoteId/send', validation_1.validateProjectId, CustomQuoteController_1.CustomQuoteController.sendCustomQuote);
router.get('/admin/pending', CustomQuoteController_1.CustomQuoteController.getAllPendingQuotes);
exports.default = router;
