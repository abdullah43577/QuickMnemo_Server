"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const router_1 = require("./routes/router");
const connectDB_1 = require("./utils/connectDB");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const passportSetup_1 = require("./utils/Google/passportSetup");
const node_cache_1 = __importDefault(require("node-cache"));
const cronJobs_1 = require("./utils/cronJobs");
exports.cache = new node_cache_1.default({ stdTTL: 60, checkperiod: 120 });
const { PORT, SESSION_SECRET } = process.env;
const app = (0, express_1.default)();
//* Middlewares
app.use((0, morgan_1.default)('dev'));
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000'],
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use((0, helmet_1.default)());
app.use((0, express_session_1.default)({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true if using HTTPS
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
(0, passportSetup_1.passportSetup)();
app.use((req, res, next) => {
    const key = req.originalUrl;
    const cachedData = exports.cache.get(key);
    if (cachedData)
        return res.status(200).json(cachedData);
    next();
});
(0, cronJobs_1.runJob)();
app.listen(PORT, async () => {
    // connect to database
    await (0, connectDB_1.connectDB)();
    console.log(`server started on http://localhost:${PORT}`);
});
// routes
app.use('/auth', router_1.router);
// routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested endpoint does not exist!',
        explorableSolutions: {
            solution1: 'ensure the "METHOD" used to call the endpoint is correct!',
            solution2: 'ensure the relative paths to the server url is defined correctly',
        },
    });
});
