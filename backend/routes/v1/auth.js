import express from "express";
import jwt from "jsonwebtoken";
import { checkPassword, createUser, findUserByEmail, toPublicUser } from "../../models/user.js";

const router = express.Router();

function signToken(user) {
  const secret = process.env.JWT_SECRET || "dev-secret";
  return jwt.sign(
    {
      sub: String(user._id),
      email: user.email,
      role: user.role,
      name: user.name,
    },
    secret,
    { expiresIn: "7d" }
  );
}

export async function registerHandler(req, res) {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "email and password required" });

    const user = await createUser({ email, password, name, role: "user" });
    const token = signToken(user);
    return res.json({ token, user: toPublicUser(user) });
  } catch {
    return res.status(400).json({ error: "Registration failed" });
  }
}

export async function loginHandler(req, res) {
  const { email, password } = req.body || {};
  const user = await findUserByEmail(email);

  if (!user || !checkPassword(user, password)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken(user);
  return res.json({ token, user: toPublicUser(user) });
}

export async function adminLoginHandler(req, res) {
  const { email, password } = req.body || {};
  const user = await findUserByEmail(email);

  if (!user || user.role !== "admin" || !checkPassword(user, password)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken(user);
  return res.json({ token, user: toPublicUser(user) });
}

// Routes under /v1/auth/*
router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.post("/admin/login", adminLoginHandler);
router.post("/logout", (_req, res) => res.json({ ok: true }));

export default router;
