import express from 'express';

import loginRoutes from './v1/login.js';
import authRoutes from './v1/auth.js';
import scootersRoutes from './v1/elsparkcyklar.js';
import rideRoutes from './v1/ride.js';
import userRoutes from './v1/user.js';
import adminRoutes from './v1/admin.js';
import stationsRoutes from './v1/stations.js';
import citiesRoutes from './v1/städer.js';

const router = express.Router();

router.use(loginRoutes);
router.use(authRoutes);
router.use(scootersRoutes);
router.use(rideRoutes);
router.use(userRoutes);
router.use(adminRoutes);
router.use(stationsRoutes);
router.use(citiesRoutes);

export default router;