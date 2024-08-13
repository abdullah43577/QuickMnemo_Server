"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentWebhook = exports.deleteMnemonics = exports.saveMnemonics = exports.getUserInfo = exports.cancelSubscription = exports.paymentCallback = exports.initiatePayment = exports.generateNewToken = exports.validateOAuthSession = void 0;
const tokens_model_1 = __importDefault(require("../models/tokens.model"));
const generateToken_1 = require("../utils/generateToken");
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const users_model_1 = __importDefault(require("../models/users.model"));
const handleErrors_1 = require("../utils/handleErrors");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const nodemailer_1 = require("../utils/nodemailer");
const validators_1 = require("../utils/validators");
const server_1 = require("../server");
const calculateNextPaymentDate_1 = require("../utils/calculateNextPaymentDate");
const { FLW_SECRET_KEY, FLW_SECRET_HASH, CLIENT_URL, SESSION_SECRET, PAYMENT_PLAN, NODE_ENV } = process.env;
const AMOUNT = 500;
const validateOAuthSession = async (req, res) => {
    try {
        const { tokenId } = req.body;
        if (!tokenId)
            return res.status(400).json({ message: 'Token ID is required!' });
        const { userId } = jsonwebtoken_1.default.verify(tokenId, SESSION_SECRET);
        if (!userId)
            return res.status(401).json({ message: 'Invalid Token' });
        // generate tokens
        const token = (0, generateToken_1.generateAccessToken)(userId);
        const refreshToken = (0, generateToken_1.generateRefreshToken)(userId);
        // update refreshToken in DB
        const newRefreshToken = new tokens_model_1.default({ token: refreshToken, userId: userId });
        await newRefreshToken.save();
        // set cookies for tokens
        res.cookie('accessToken', token, { httpOnly: true, secure: NODE_ENV === 'production', sameSite: 'none', maxAge: 15 * 60 * 1000 });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: NODE_ENV === 'production', sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.sendStatus(200);
    }
    catch (error) {
        (0, handleErrors_1.handleErrors)({ res, error });
    }
};
exports.validateOAuthSession = validateOAuthSession;
const generateNewToken = async (req, res) => {
    try {
        const { userId, refreshToken } = req;
        const refreshTokens = await tokens_model_1.default.findOne({ token: refreshToken });
        if (!refreshTokens || refreshToken !== refreshTokens.token || userId !== refreshTokens.userId.toString())
            return res.status(401).json({ message: 'unauthorized' });
        const accessToken = (0, generateToken_1.generateAccessToken)(userId);
        res.cookie('accessToken', accessToken, { secure: true, httpOnly: true, maxAge: 30 * 60 * 1000 });
        res.status(200).json({ message: 'Access token generated successfully!' });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server error', error });
    }
};
exports.generateNewToken = generateNewToken;
const initiatePayment = async (req, res) => {
    try {
        const { userId } = req;
        const user = await users_model_1.default.findById(userId);
        if (!user)
            return res.status(404).json({ message: 'User not found!' });
        //* IF USER WAS ONCE A SUBSCRIBER
        if (user.subscription.id) {
            await axios_1.default.put(`https://api.flutterwave.com/v3/subscriptions/user.subscription.id/activate`);
            user.subscription.status = 'active';
            await user.save();
            res.status(200).json({ type: 'subscription_activated', message: 'User subscription activated successfully' });
        }
        else {
            //* NEW SUBSCRIBER
            const tx_ref = (0, uuid_1.v4)();
            const { data } = await axios_1.default.post('https://api.flutterwave.com/v3/payments', {
                tx_ref,
                amount: AMOUNT,
                currency: 'NGN',
                redirect_url: `${CLIENT_URL}`, // ideally be a frontend url
                customer: {
                    email: user.email,
                },
                customizations: {
                    title: 'QuickMnemo Subscription',
                    description: 'QuickMnemo: Effortlessly generate personalized mnemonics to enhance memory retention and learning. Simplify complex information with our user-friendly platform.',
                },
                payment_plan: PAYMENT_PLAN,
            }, {
                headers: {
                    Authorization: `Bearer ${FLW_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            });
            res.status(200).json({ type: 'new_subscription', message: data.data.link });
        }
    }
    catch (error) {
        (0, handleErrors_1.handleErrors)({ res, error });
    }
};
exports.initiatePayment = initiatePayment;
const paymentCallback = async (req, res) => {
    try {
        const { status, tx_ref, transaction_id } = req.body;
        const { userId } = req;
        if (status === 'successful' || status === 'completed') {
            const response = await axios_1.default.get(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
                headers: {
                    Authorization: `Bearer ${FLW_SECRET_KEY}`,
                },
            });
            const dataObj = response.data.data;
            if (dataObj.status === 'successful' && dataObj.amount === AMOUNT && dataObj.currency === 'NGN') {
                //* subscription ID
                const { id } = dataObj;
                const user = await users_model_1.default.findById(userId);
                if (!user)
                    return res.status(404).json({ message: 'User not found!' });
                const subscribedAt = new Date();
                const nextPaymentDate = (0, calculateNextPaymentDate_1.calculateNextPaymentDate)(subscribedAt);
                user.subscription = {
                    id,
                    status: 'active',
                    subscribedAt,
                    nextPaymentDate,
                };
                user.isPremium = true;
                await user.save();
                // send subscription newsletter
                await (0, nodemailer_1.transportMail)({ email: user.email });
                return res.status(200).json({ message: 'Payment successfully made!' });
            }
        }
        else if (status === 'pending') {
            return res.status(202).json({ message: 'Payment is still pending. Please wait for confirmation.' });
        }
        return res.status(400).json({ message: 'Payment was not successful.' });
    }
    catch (error) {
        (0, handleErrors_1.handleErrors)({ res, error });
    }
};
exports.paymentCallback = paymentCallback;
const cancelSubscription = async (req, res) => {
    try {
        const { userId } = req;
        const user = await users_model_1.default.findById(userId);
        if (!user)
            return res.status(404).json({ message: 'user not found!' });
        // cancel user subscription
        await axios_1.default.put(`https://api.flutterwave.com/v3/subscriptions/${user.subscription.id}/cancel`, {
            headers: {
                Authorization: `Bearer ${FLW_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        });
        user.subscription = {
            status: 'cancelled',
            cancelledAt: new Date(),
        };
        await user.save();
        res.status(200).json({ message: 'User subscription cancelled successfully' });
    }
    catch (error) {
        (0, handleErrors_1.handleErrors)({ res, error });
    }
};
exports.cancelSubscription = cancelSubscription;
const getUserInfo = async (req, res) => {
    try {
        const key = req.originalUrl;
        const { userId } = req;
        const user = await users_model_1.default.findById(userId).lean();
        if (!user)
            return res.status(404).json({ message: 'user not found' });
        const newObj = {};
        for (const key in user) {
            if (key === 'password' || key === 'googleId') {
                continue;
            }
            newObj[key] = user[key];
        }
        // set cache
        server_1.cache.set(key, newObj);
        res.status(200).json(newObj);
    }
    catch (error) {
        (0, handleErrors_1.handleErrors)({ res, error });
    }
};
exports.getUserInfo = getUserInfo;
const saveMnemonics = async (req, res) => {
    try {
        const { userId } = req;
        const { savedMnemonics } = validators_1.savedMnemonicsSchema.parse(req.body);
        const user = await users_model_1.default.findById(userId);
        if (!user)
            return res.status(404).json({ message: 'User not found!' });
        user.savedMnemonics.push(...savedMnemonics);
        await user.save();
        res.sendStatus(200);
    }
    catch (error) {
        (0, handleErrors_1.handleErrors)({ res, error });
    }
};
exports.saveMnemonics = saveMnemonics;
const deleteMnemonics = async (req, res) => {
    try {
        const { userId } = req;
        const { txt } = req.body;
        const user = await users_model_1.default.findById(userId);
        if (!user)
            return res.status(404).json({ message: 'user not found!' });
        user.savedMnemonics = user.savedMnemonics.filter((mnemonic) => mnemonic.toLowerCase() !== txt.toLowerCase());
        await user.save();
        res.status(200).json({ message: 'Mnemonic deleted successfully!' });
    }
    catch (error) {
        (0, handleErrors_1.handleErrors)({ res, error });
    }
};
exports.deleteMnemonics = deleteMnemonics;
const generateMnemonics = async (req, res) => {
    try {
        // generate mnemonics
    }
    catch (error) {
        (0, handleErrors_1.handleErrors)({ res, error });
    }
};
const paymentWebhook = async (req, res) => {
    try {
        // If you specified a secret hash, check for the signature
        const signature = req.headers['verif-hash'];
        if (!signature || signature !== FLW_SECRET_HASH) {
            // This request isn't from Flutterwave; discard
            res.sendStatus(401);
        }
        const payload = req.body;
        // It's a good idea to log all received events.
        console.log(payload);
        res.sendStatus(200);
    }
    catch (error) {
        (0, handleErrors_1.handleErrors)({ res, error });
    }
};
exports.paymentWebhook = paymentWebhook;
