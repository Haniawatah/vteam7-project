import express from 'express';
import { getDb } from '../../database.js';
import { authenticate } from '../../middleware/utils.js';

import * as elsparkcykel from '../../models/elsparkcykel.js'

const router = express.Router();

// GET /v1/scooters
router.get('/', authenticate, async (_req, res) => {
	try {
		const db = await getDb();
		if (!db) return res.json([]);

		const scooters = await db.collection('scooters').find({}).limit(2000).toArray();
		return res.json(
		scooters.map((s) => ({
			id: String(s._id),
			batteryLevel: Number(s.batteryLevel ?? s.battery ?? 0),
			status: s.status ?? 'Off',
			location: s.location ?? s.position ?? { lat: 0, lng: 0 },
			city: s.city ?? s.stad ?? '',
		}))
		);
	} catch {
		return res.json([]);
	}
});



router.get('/available', authenticate, async (req, res) => {
    const rideId = req.params.rideId;
    const userId = req.user.sub;

    const data = await elsparkcykel.getScootersForMap(userId);

    res.status(200).json({ data });

});


export default router;
