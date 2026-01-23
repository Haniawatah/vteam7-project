import express from "express";
import passport from "../../middleware/passport.js"; 
import { signToken } from '../../middleware/signtoken.js';
import { getDb } from '../../database.js';



const router = express.Router();

router.get("/google", (req, res, next) => {
  next();
}, passport.authenticate("google", { scope: ["profile", "email"] }));



router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    const db = getDb();

    console.log(req.user, "payload");

    const users = db.collection('users');

    const user = await users.findOne({ email: String(req.user.email) });

    console.log(user, "----------------------------")

    const token = signToken(user);

    console.log(token, "tokn")

    res.redirect(
      `http://localhost:5173/oauth-success?token=${encodeURIComponent(token)}`
    );
  }
);


export default router;
