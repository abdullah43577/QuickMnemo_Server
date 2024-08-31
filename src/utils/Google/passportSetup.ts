import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../../models/users.model';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

export const passportSetup = function () {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID as string,
        clientSecret: GOOGLE_CLIENT_SECRET as string,
        // callbackURL: '/auth/google/callback',
      },
      async function (_accessToken, _refreshToken, profile, done) {
        try {
          const { id, emails, photos } = profile;

          const user = await User.findOneAndUpdate({ googleId: id }, { $setOnInsert: { email: emails?.[0].value, googleId: id } }, { upsert: true, new: true, setDefaultsOnInsert: true });

          done(null, user);
        } catch (error) {
          console.log(error);
          done(error, undefined);
        }
      }
    )
  );

  // storing current user id
  passport.serializeUser((user, done) => {
    done(null, (user as any).id);
  });

  // return user by id when requested
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      if (user) {
        done(null, user);
      }
    } catch (error) {
      done(error, undefined);
    }
  });
};
