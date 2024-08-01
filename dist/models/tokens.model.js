"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const refreshTokenSchema = new mongoose_1.Schema({
    token: {
        type: String,
        required: true,
    },
    user: {
        ref: 'User',
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
    },
}, { timestamps: true });
const RefreshToken = (0, mongoose_1.model)('RefreshToken', refreshTokenSchema);
exports.default = RefreshToken;
