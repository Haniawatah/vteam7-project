import express from 'express';

import { getDb } from '../../database.js';
import { authenticate } from '../../middleware/utils.js';
import requireAdmin from '../../middleware/admin.js';

const router = express.Router();


router.get('/subs', async (_req, res, next) => {
    console.log("hejsan")
    try {
        const db = getDb();
        if (!db) return res.json([]);

        console.log(db, "db")

        const docs = await db.collection('subscriptionLog').find({}).toArray();
        console.log(docs, "-----------------------------------")
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
        res.json(docs.map(normalize).filter((s) => s.id));
    } catch (e) {
        next(e);
    }
});


export default router;
