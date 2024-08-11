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
const passport_1 = __importDefault(require("passport"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const { SESSION_SECRET, CLIENT_URL } = process.env;
const router = (0, express_1.Router)();
exports.router = router;
//* Google Auth route
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport_1.default.authenticate('google'), async (req, res) => {
    try {
        const { user } = req;
        if (!user)
            return res.status(401).json({ error: 'Authentication failed' });
        const userId = user._id.toString();
        const tokenId = jsonwebtoken_1.default.sign({ userId }, SESSION_SECRET, { expiresIn: '10m' });
        res.redirect(`${CLIENT_URL}?token=${tokenId}`);
    }
    catch (error) {
        res.status(500).json({ message: 'Interal Server Error', error });
    }
});
router.post('/google/callback/validate-session', action_controller_1.validateOAuthSession);
// auth routes
router.get('/', auth_controller_1.testApi);
router.post('/register', auth_controller_1.register);
router.post('/login', auth_controller_1.login);
router.delete('/logout', validateToken_1.validateRefreshToken, auth_controller_1.logout);
// action routes
router.post('/token', validateToken_1.validateRefreshToken, action_controller_1.generateNewToken);
router.get('/subscribe', validateToken_1.validateAccessToken, action_controller_1.initiatePayment);
router.post('/subscribe/callback', validateToken_1.validateAccessToken, action_controller_1.paymentCallback);
router.put('/subscription/cancel', validateToken_1.validateAccessToken, action_controller_1.cancelSubscription);
router.post('/flw-webhook', action_controller_1.paymentWebhook);
router.get('/user-info', validateToken_1.validateAccessToken, action_controller_1.getUserInfo);
router.put('/save-mnemonics', validateToken_1.validateAccessToken, action_controller_1.saveMnemonics);
