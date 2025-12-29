import express from "express";
import { getDb } from "../../database.js";
import { listInvoicesByUser } from "../../models/invoices.js";
import { getUserDocByToken, toUserDto } from "../../models/user.js";

const router = express.Router();

async function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const db = await getDb();
  const userDoc = await getUserDocByToken(db, token);
  if (!userDoc) return res.status(401).json({ error: "Unauthorized" });

  req.user = toUserDto(userDoc);
  next();
}

// Minimal placeholder invoices endpoint (safe to expand later)
router.get("/invoices", requireAuth, async (req, res) => {
  res.json([]);
});

export default router;
