import express from 'express';

import { getDb } from '../../database.js';
import { authenticate } from '../../middleware/utils.js';
import requireAdmin from '../../middleware/admin.js';

const router = express.Router();


router.get('/subs', async (_req, res, next) => {
    try {
        const db = getDb();
        if (!db) return res.json([]);

        const docs = await db.collection('subscriptionLog').find({}).toArray();
        res.json(docs);
    } catch (e) {
        next(e);
    }
});



router.get('/rides', async (_req, res, next) => {
    try {
        const db = getDb();
        if (!db) return res.json([]);

        const docs = await db.collection('log').find({}).toArray();
        res.status(200).json( docs );
    } catch (e) {
        next(e);
    }
});

// Kollar kartan för en gammal ride
router.get('/ride/:rideId', authenticate, async (req, res, next) => {
    try {
        const db = getDb();
        if (!db) return res.status(500).json({ message: 'Database not configured' });


        const ride = await db.collection('log').findOne({ id: req.params.rideId });
        if (!ride) return res.status(404).json({ message: 'Ride not found' });


        const rideUserId = ride.userId ?? ride.user_id;
        if (req.user.role !== 'admin' && rideUserId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

        res.json({ ride });
    } catch (e) {
        next(e);
    }
});




export default router;
