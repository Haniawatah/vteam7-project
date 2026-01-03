import express from 'express';
import { loginHandler, registerHandler } from './auth.js';

const router = express.Router();

// Frontend expects these:
router.post('/login', loginHandler);
router.post('/register', registerHandler);

export default router;
