"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        default: null,
    },
    isPremium: {
        type: Boolean,
        default: false,
    },
    subscription: {
        id: {
            type: String,
            default: null,
        },
        status: {
            type: String,
            enum: ['active', 'pending', 'cancelled'],
            default: 'pending',
        },
        subscribedAt: {
            type: Date,
            default: null,
        },
        nextPaymentDate: {
            type: Date,
            default: null,
        },
        cancelledAt: {
            type: Date,
            default: null,
        },
    },
    savedMnemonics: { type: [String], default: [] },
    googleId: {
        type: String,
        default: null,
    },
}, { timestamps: true });
const User = (0, mongoose_1.model)('User', userSchema);
exports.default = User;
