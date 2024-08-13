"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = exports.register = exports.testApi = void 0;
const tokens_model_1 = __importDefault(require("../models/tokens.model"));
const generateToken_1 = require("../utils/generateToken");
const validators_1 = require("../utils/validators");
const handleErrors_1 = require("../utils/handleErrors");
const users_model_1 = __importDefault(require("../models/users.model"));
const hashPassword_1 = require("../utils/hashPassword");
const { NODE_ENV } = process.env;
const testApi = async (req, res) => {
    res.status(200).json({ message: 'SERVERS ARE LIVE!!!' });
};
exports.testApi = testApi;
const register = async (req, res) => {
    try {
        const { email, password } = validators_1.authValidator.parse(req.body);
        //* check if user exists
        const existingUser = await users_model_1.default.findOne({ email });
        if (existingUser)
            return res.status(409).json({ message: 'User with credentials exists!' });
        const encryptedPassword = await (0, hashPassword_1.hashPassword)(password);
        const user = new users_model_1.default({ email, password: encryptedPassword });
        await user.save();
        // //* generate tokens
        // const token = generateAccessToken(user._id.toString());
        // const refreshToken = generateRefreshToken(user._id.toString());
        // //* update refreshToken in DB
        // const newRefreshToken = new RefreshToken({ token: refreshToken, userId: user._id });
        // await newRefreshToken.save();
        // //* set cookies for tokens
        // res.cookie('accessToken', token, { secure: true, httpOnly: true, maxAge: 30 * 60 * 1000 });
        // res.cookie('refreshToken', refreshToken, { secure: true, httpOnly: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.status(200).json({ message: 'User created successfully!' });
    }
    catch (error) {
        (0, handleErrors_1.handleErrors)({ res, error });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = validators_1.authValidator.parse(req.body);
        const existingUser = await users_model_1.default.findOne({ email });
        if (!existingUser)
            return res.status(404).json({ message: 'User with credentials not found!' });
        //* decrypt password
        const isMatch = await (0, hashPassword_1.comparePassword)(password, existingUser.password);
        if (!isMatch)
            return res.status(400).json({ message: 'email or password incorrect' });
        //* generate tokens
        const token = (0, generateToken_1.generateAccessToken)(existingUser._id.toString());
        const refreshToken = (0, generateToken_1.generateRefreshToken)(existingUser._id.toString());
        //* update refreshToken in DB
        const newRefreshToken = new tokens_model_1.default({ token: refreshToken, userId: existingUser._id });
        await newRefreshToken.save();
        //* set cookies for tokens
        res.cookie('accessToken', token, { secure: NODE_ENV === 'production', httpOnly: true, maxAge: 30 * 60 * 1000 });
        res.cookie('refreshToken', refreshToken, { secure: NODE_ENV === 'production', httpOnly: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.status(200).json({ message: 'User created successfully!' });
    }
    catch (error) {
        (0, handleErrors_1.handleErrors)({ res, error });
    }
};
exports.login = login;
const logout = async (req, res) => {
    try {
        const { refreshToken } = validators_1.logoutValidator.parse(req.body);
        await tokens_model_1.default.findOneAndDelete({ token: refreshToken });
        res.sendStatus(204);
    }
    catch (error) {
        (0, handleErrors_1.handleErrors)({ res, error });
    }
};
exports.logout = logout;
