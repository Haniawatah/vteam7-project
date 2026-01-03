import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// v1 routers
import authRoutes from './v1/auth.js';
import adminRoutes from './v1/admin.js';
import userRoutes from './v1/user.js';
import rideRoutes from './v1/ride.js';
import cityRoutes from './v1/städer.js';
import scootersRoutes from './v1/elsparkcyklar.js';
import chargingRoutes from './v1/laddning.js';
import parkingRoutes from './v1/parkering.js';
import invoiceRoutes from './v1/invoices.js';
import loginRoutes from './v1/login.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/v1/health', (_req, res) => res.json({ ok: true }));

// IMPORTANT: mount under /v1 so frontend baseURL "/v1" works
app.use('/v1', authRoutes);
app.use('/v1', loginRoutes);
app.use('/v1', adminRoutes);
app.use('/v1', userRoutes);
app.use('/v1', rideRoutes);
app.use('/v1', scootersRoutes);
app.use('/v1', chargingRoutes);
app.use('/v1', parkingRoutes);
app.use('/v1', invoiceRoutes);
app.use('/v1', cityRoutes);

// 404 (helps debugging which path is still missing)
app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.path }));

export default app;