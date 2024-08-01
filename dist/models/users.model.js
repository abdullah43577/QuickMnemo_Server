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
    googleId: {
        type: String,
        default: null,
    },
}, { timestamps: true });
const User = (0, mongoose_1.model)('User', userSchema);
exports.default = User;
