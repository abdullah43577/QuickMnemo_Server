"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRefreshToken = exports.validateAccessToken = void 0;
require("dotenv/config");
const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } = process.env;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validateAccessToken = function (req, res, next) {
    let { reqType } = req.body;
    console.log(req.body);
    if (reqType.toLowerCase() === 'mnemonic')
        return next(); //* this is used to bypass the normal token validation for mnemonic generation
    let token = req.headers['authorization']?.split(' ')[1];
    if (!token)
        return res.status(401).json({ message: 'Access Denied, No token provided!' });
    try {
        const { id } = jsonwebtoken_1.default.verify(token, ACCESS_TOKEN_SECRET);
        req.userId = id;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Unauthorized Access!' });
    }
};
exports.validateAccessToken = validateAccessToken;
const validateRefreshToken = function (req, res, next) {
    let refreshToken = req.body.refreshToken;
    if (!refreshToken)
        return res.status(401).json({ message: 'Access Denied, Refresh token not provided!' });
    try {
        const { id } = jsonwebtoken_1.default.verify(refreshToken, REFRESH_TOKEN_SECRET);
        req.userId = id;
        req.refreshToken = refreshToken;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Unauthorized Access!' });
    }
};
exports.validateRefreshToken = validateRefreshToken;
