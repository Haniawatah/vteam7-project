import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "./utils.js";

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

function getToken(req) {
  const auth = req.headers?.authorization || req.headers?.Authorization || "";
  if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  const x = req.headers?.["x-access-token"];
  if (typeof x === "string" && x.trim()) return x.trim();
  return "";
}

export function authenticate(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ message: "Missing token" });

  const secret = getJwtSecret();
  if (!secret)
    return res.status(500).json({ message: "JWT secret is not configured" });

  try {
    req.user = jwt.verify(token, secret);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Default export as function too (avoids import mismatches)
export default authenticate;
