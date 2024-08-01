"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validateToken_1 = require("../utils/validateToken");
const action_controller_1 = require("../controllers/action.controller");
const generateToken_1 = require("../utils/generateToken");
const tokens_model_1 = __importDefault(require("../models/tokens.model"));
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
exports.router = router;
//* Google Auth routes
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport_1.default.authenticate('google'), async (req, res) => {
    const { user } = req;
    if (!user)
        return res.status(401).json({ error: 'Authentication failed' });
    const userId = user._id.toString();
    // generate tokens
    const token = (0, generateToken_1.generateAccessToken)(userId);
    const refreshToken = (0, generateToken_1.generateRefreshToken)(userId);
    // update refreshToken in DB
    const newRefreshToken = new tokens_model_1.default({ token: refreshToken, user: userId });
    await newRefreshToken.save();
    // set cookies for tokens
    res.cookie('accessToken', token, { httpOnly: true, secure: true, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(200).json({ message: 'User logged in successfully', token, refreshToken });
});
// auth routes
router.get('/', auth_controller_1.testApi);
router.post('/register', auth_controller_1.register);
router.post('/login', auth_controller_1.login);
router.delete('/logout', validateToken_1.validateRefreshToken, auth_controller_1.logout);
// action routes
router.post('/token', validateToken_1.validateRefreshToken, action_controller_1.generateNewToken);
