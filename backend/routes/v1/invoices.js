import express from 'express';
import { getDb } from '../../database.js';
import { authenticate } from '../../middleware/utils.js';
import requireAdmin from '../../middleware/admin.js';

const router = express.Router();

// Minimal admin listing endpoint (prevents 404 later; safe empty fallback)
router.get('/all', authenticate, requireAdmin, async (_req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.json([]);
    const invoices = await db.collection('invoices').find({}).limit(500).toArray();
    return res.json(
      invoices.map((i) => ({
        id: String(i._id ?? i.id ?? ''),
        userId: String(i.userId ?? i.user_id ?? ''),
        email: String(i.email ?? ''),
        money: Number(i.amount ?? i.money ?? 0),
        date: i.date ?? i.createdAt ?? null,
        payment_method: i.payment_method ?? null,
        status: i.status ?? '—',
      }))
    );
  } catch {
    return res.json([]);
  }
});

export default router;
