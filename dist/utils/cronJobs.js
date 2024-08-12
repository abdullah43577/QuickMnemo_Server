"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pingServer = exports.runJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const users_model_1 = __importDefault(require("../models/users.model"));
const axios_1 = __importDefault(require("axios"));
const runJob = function () {
    node_cron_1.default.schedule('0 0 * * *', async () => {
        try {
            const today = new Date();
            // Find users whose subscription period has ended and who have cancelled
            const usersToDowngrade = await users_model_1.default.find({
                'subscription.status': 'cancelled',
                'subscription.nextPaymentDate': {
                    $lte: today,
                },
            });
            // Downgrade each user
            for (const user of usersToDowngrade) {
                user.isPremium = false;
                await user.save();
                // Optionally, notify the user about the downgrade
            }
            console.log(`Downgraded ${usersToDowngrade.length} users.`);
        }
        catch (error) {
            console.error('Error running the downgrade cron job:', error);
        }
    });
};
exports.runJob = runJob;
const pingServer = function () {
    node_cron_1.default.schedule('*/10 * * * *', async () => {
        try {
            // Ping your server's /ping endpoint
            const response = await axios_1.default.get('https://quickmnemo-server.onrender.com/auth/');
            console.log(`Pinged server: ${response.data.message}`);
        }
        catch (error) {
            console.error('Error pinging the server:', error);
        }
    });
};
exports.pingServer = pingServer;
