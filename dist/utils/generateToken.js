"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRefreshToken = exports.generateAccessToken = void 0;
require("dotenv/config");
const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } = process.env;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateAccessToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};
exports.generateRefreshToken = generateRefreshToken;
