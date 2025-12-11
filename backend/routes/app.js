import express from 'express';
import elsparkcyklarRoutesV1 from './v1/elsparkcyklar.js';
import paerkeringRoutesV1 from './v1/parkering.js';
import laddningsRoutesV1 from './v1/laddning.js';
import städerRoutesV1 from './v1/städer.js';
import userRoutesV1 from './v1/user.js';

const router = express.Router();

//Version 1 routes
router.use('/elsparkcyklar', elsparkcyklarRoutesV1);
router.use('/parkeringar', paerkeringRoutesV1);
router.use('/laddningar', laddningsRoutesV1);
router.use('/städer', städerRoutesV1);
router.use('/user', userRoutesV1);

export default router;