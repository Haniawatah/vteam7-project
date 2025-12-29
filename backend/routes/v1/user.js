import { Router } from 'express';
import {
  authenticateUser,
  requireAdmin,
  registerUser,
  loginUser,
  loginAdmin,
  logoutUser,
  listUsers,
  getPaymentInfo,
  updatePaymentInfo,
} from '../../models/user.js';

const router = Router();

// Auth
router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body ?? {};
    const data = await registerUser({ email, password, name });
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e?.message || 'Registration failed' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    const data = await loginUser({ email, password });
    res.json(data);
  } catch (e) {
    res.status(401).json({ error: e?.message || 'Login failed' });
  }
});

router.post('/auth/logout', authenticateUser, async (req, res) => {
  await logoutUser(req.token);
  res.json({ ok: true });
});

router.post('/auth/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    const data = await loginAdmin({ email, password });
    res.json(data);
  } catch (e) {
    res.status(401).json({ error: e?.message || 'Login failed' });
  }
});

// Users
router.get('/users', authenticateUser, requireAdmin, async (req, res) => {
  const users = await listUsers();
  res.json(users);
});

// Payment (me)
router.get('/users/me/payment', authenticateUser, async (req, res) => {
  const data = await getPaymentInfo(req.user._id);
  res.json(data);
});

router.put('/users/me/payment', authenticateUser, async (req, res) => {
  try {
    const data = await updatePaymentInfo(req.user._id, req.body ?? {});
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e?.message || 'Update failed' });
  }
});

export default router;
