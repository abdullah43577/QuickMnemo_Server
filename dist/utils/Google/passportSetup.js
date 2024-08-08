"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.passportSetup = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const users_model_1 = __importDefault(require("../../models/users.model"));
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
const passportSetup = function () {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback',
    }, async function (_accessToken, _refreshToken, profile, done) {
        try {
            const { id, emails, photos } = profile;
            const user = await users_model_1.default.findOneAndUpdate({ googleId: id }, { $setOnInsert: { email: emails?.[0].value, googleId: id } }, { upsert: true, new: true, setDefaultsOnInsert: true });
            done(null, user);
        }
        catch (error) {
            console.log(error);
            done(error, undefined);
        }
    }));
    // storing current user id
    passport_1.default.serializeUser((user, done) => {
        done(null, user.id);
    });
    // return user by id when requested
    passport_1.default.deserializeUser(async (id, done) => {
        try {
            const user = await users_model_1.default.findById(id);
            if (user) {
                done(null, user);
            }
        }
        catch (error) {
            done(error, undefined);
        }
    });
};
exports.passportSetup = passportSetup;
