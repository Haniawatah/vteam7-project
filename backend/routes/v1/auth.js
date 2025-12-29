import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const payload = {
      email: req.user.email,
      name: req.user.name,
      roll: req.user.roll,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Skicka tillbaka till frontend
  res.redirect(`http://localhost:5173/oauth-success?token=${token}`);
  }
);

export default router;
