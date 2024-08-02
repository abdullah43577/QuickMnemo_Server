"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentCallback = exports.initiatePayment = exports.generateNewToken = void 0;
const tokens_model_1 = __importDefault(require("../models/tokens.model"));
const generateToken_1 = require("../utils/generateToken");
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const users_model_1 = __importDefault(require("../models/users.model"));
const transaction_model_1 = __importDefault(require("../models/transaction.model"));
const handleErrors_1 = require("../utils/handleErrors");
const { FLW_SECRET_KEY, FLW_SECRET_HASH } = process.env;
const generateNewToken = async (req, res) => {
    try {
        const { userId, refreshToken } = req;
        const refreshTokens = await tokens_model_1.default.findOne({ token: refreshToken });
        if (!refreshTokens || refreshToken !== refreshTokens.token || userId !== refreshTokens.user.toString())
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
        const tx_ref = (0, uuid_1.v4)();
        const { data } = await axios_1.default.post('https://api.flutterwave.com/v3/payments', {
            tx_ref,
            amount: '950',
            currency: 'NGN',
            redirect_url: 'http://localhost:8080/auth/payment/callback', // ideally be a frontend url
            customer: {
                email: user.email,
            },
            customizations: {
                title: 'QuickMnemo Subscription',
            },
        }, {
            headers: {
                Authorization: `Bearer ${FLW_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        });
        // store data in DB
        const transaction = new transaction_model_1.default({ user: userId, ref: tx_ref });
        await transaction.save();
        res.status(200).json({ message: data.data.link });
    }
    catch (error) {
        (0, handleErrors_1.handleErrors)({ res, error });
    }
};
exports.initiatePayment = initiatePayment;
const paymentCallback = async (req, res) => {
    try {
        const { status, tx_ref, transaction_id } = req.query;
        if (status === 'successful' || status === 'completed') {
            // verify transaction
            const response = await axios_1.default.get(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
                headers: {
                    Authorization: `Bearer ${FLW_SECRET_KEY}`,
                },
            });
            if (response.data.status === 'successful' && response.data.amount === 950 && response.data.currency === 'NGN') {
                console.log('i ran');
                // update transaction
                const transaction = await transaction_model_1.default.findOne({ ref: tx_ref });
                if (!transaction)
                    return res.status(404).json({ message: 'Transaction not found!' });
                console.log(transaction, 'transact');
                transaction.isSuccessful = true;
                await transaction.save();
                res.status(200).json({ message: 'Payment successfully made!' });
            }
        }
        else if (status === 'pending') {
            return res.status(202).json({ message: 'Payment is still pending. Please wait for confirmation.' });
        }
        else {
            return res.status(400).json({ message: 'Payment was not successful.' });
        }
    }
    catch (error) {
        (0, handleErrors_1.handleErrors)({ res, error });
    }
};
exports.paymentCallback = paymentCallback;
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
