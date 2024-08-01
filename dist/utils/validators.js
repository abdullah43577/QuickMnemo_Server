"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutValidator = exports.authValidator = void 0;
const zod_1 = require("zod");
exports.authValidator = zod_1.z.object({
    email: zod_1.z.string().email({ message: 'Email is required!' }),
    password: zod_1.z.string({ message: 'Password is required!' }).min(8, { message: 'Password is too short' }),
});
exports.logoutValidator = zod_1.z.object({
    refreshToken: zod_1.z.string({ message: 'Refresh Token is required!' }),
});
