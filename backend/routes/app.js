
import express from 'express';
import elsparkcyklarRoutesV1 from './v1/elsparkcyklar.js';
import paerkeringRoutesV1 from './v1/parkering.js';
import laddningsRoutesV1 from './v1/laddning.js';
import städerRoutesV1 from './v1/städer.js';
import userRoutesV1 from './v1/user.js';
import loginRoutesV1 from './v1/login.js';

import rideRoutesV1 from './v1/ride.js';

import authRoutesV1 from './v1/auth.js';
import adminRoutesV1 from './v1/admin.js';

//passport google oauth
import passport from "../middleware/passport.js";


const router = express.Router();

router.use(passport.initialize());


router.get('/health', (req, res) => res.json({ ok: true }));

//Version 1 routes
router.use('/scooters', elsparkcyklarRoutesV1);
router.use('/parkeringar', paerkeringRoutesV1);
router.use('/laddningar', laddningsRoutesV1);
router.use('/cities', städerRoutesV1);
router.use('/user', userRoutesV1);
router.use('/ride', rideRoutesV1);
router.use('/auth', authRoutesV1);
router.use('/admin', adminRoutesV1);
router.use('/', loginRoutesV1);

export default router;