"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleErrors = void 0;
const zod_1 = require("zod");
const handleErrors = function ({ res, error }) {
    if (error instanceof zod_1.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    else {
        res.status(500).json({ message: 'Internal Server Error', error });
    }
};
exports.handleErrors = handleErrors;
