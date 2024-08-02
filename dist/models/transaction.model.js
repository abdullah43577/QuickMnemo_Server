"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const transactionSchema = new mongoose_1.Schema({
    user: {
        ref: 'User',
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
    },
    ref: {
        type: String,
        required: true,
    },
    isSuccessful: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
const Transaction = (0, mongoose_1.model)('Transaction', transactionSchema);
exports.default = Transaction;
