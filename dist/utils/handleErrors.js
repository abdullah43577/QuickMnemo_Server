"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleErrors = void 0;
const zod_1 = require("zod");
const axios_1 = require("axios");
const handleErrors = function ({ res, error }) {
    if (error instanceof zod_1.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    else if (error instanceof axios_1.AxiosError) {
        res.status(error.response?.status).json(error.response?.data);
    }
    else {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};
exports.handleErrors = handleErrors;
