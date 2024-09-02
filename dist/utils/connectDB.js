"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
require("dotenv/config");
const { DB_USER, DB_PASS, DB_NAME } = process.env;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    const dbURI = `mongodb+srv://${DB_USER}:${DB_PASS}@quickmnemocluster.vl0va.mongodb.net/${DB_NAME}`;
    // const dbURI = `mongodb://localhost:27017/${DB_NAME}`;
    // new comment here
    try {
        await mongoose_1.default.connect(dbURI);
        console.log('Connected to MongoDB');
    }
    catch (err) {
        console.log('Error connecting to MongoDB', err);
    }
};
exports.connectDB = connectDB;
