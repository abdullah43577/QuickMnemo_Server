"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNewToken = void 0;
const tokens_model_1 = __importDefault(require("../models/tokens.model"));
const generateToken_1 = require("../utils/generateToken");
const generateNewToken = async (req, res) => {
    try {
        const { userId, refreshToken } = req;
        const refreshTokens = await tokens_model_1.default.findOne({ token: refreshToken });
        if (!refreshTokens || userId !== refreshToken.user)
            return res.status(401).json({ message: 'unauthorized' });
        const accessToken = (0, generateToken_1.generateAccessToken)(userId);
        res.status(200).json({ accessToken });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server error', error });
    }
};
exports.generateNewToken = generateNewToken;
