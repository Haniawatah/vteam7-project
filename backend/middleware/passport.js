import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const hasGoogleEnv =
  Boolean(process.env.GOOGLE_CLIENT_ID) &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET) &&
  Boolean(process.env.GOOGLE_CALLBACK_URL);

if (hasGoogleEnv) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;

          let account = await user.getOne(email);

          if (!account) {
            account = await user.register({
              email,
              name: profile.displayName,
              wallet: 0,
              roll: "user",
              oauthProvider: "google",
            });
          }

          return done(null, account);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

export default passport;
