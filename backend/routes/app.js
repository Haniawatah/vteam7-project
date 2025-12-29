import express from 'express';

import userRouter from './v1/user.js';
import scooterRouter from './v1/elsparkcyklar.js';
import rideRouter from './v1/ride.js';
import invoicesRouter from './v1/invoices.js';
import chargingRouter from './v1/laddning.js';
import parkingRouter from './v1/parkering.js';
import citiesRouter from './v1/städer.js';

const router = express.Router();

router.get('/v1/health', (_req, res) => res.json({ ok: true }));

router.use('/v1', userRouter);
router.use('/v1', scooterRouter);
router.use('/v1', rideRouter);
router.use('/v1', invoicesRouter);
router.use('/v1', chargingRouter);
router.use('/v1', parkingRouter);
router.use('/v1', citiesRouter);

export default router;