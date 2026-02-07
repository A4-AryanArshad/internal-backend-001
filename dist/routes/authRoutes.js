"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.post('/signup', AuthController_1.AuthController.signup);
router.post('/login', AuthController_1.AuthController.login);
// Protected routes
router.get('/me', auth_1.authenticate, AuthController_1.AuthController.getCurrentUser);
exports.default = router;
