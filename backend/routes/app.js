import express from 'express';

import loginRoutes from './v1/login.js';
import authRoutes from './v1/auth.js';
import scootersRoutes from './v1/elsparkcyklar.js';
import rideRoutes from './v1/ride.js';
import userRoutes from './v1/user.js';
import adminRoutes from './v1/admin.js';

import logRoutes from './v1/logs.js';
import invoicesRoutes from './v1/invoices.js';

import parkingRoutes from './v1/parkering.js';
import laddningRoutes from './v1/laddning.js';

const router = express.Router();

router.use(loginRoutes);
router.use('/auth', authRoutes);
router.use(scootersRoutes);
router.use(rideRoutes);
router.use('/user', userRoutes);
router.use(adminRoutes);

router.use('/logs', logRoutes);
router.use('/parking', parkingRoutes);
router.use('/charging', laddningRoutes);
router.use('/invoices', invoicesRoutes);

export default router;