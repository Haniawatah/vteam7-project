import express from 'express';
import laddnings_station from '../../models/laddnings-stationer.js';
import { getDb } from '../../database.js';
import { authenticate } from '../../middleware/utils.js';
import requireAdmin from '../../middleware/admin.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);


// GET all charging stations
router.get('/', async (req, res) => {
    const data = await laddnings_station.getAll();
    res.status(200).json(data);
});



router.post('/add', async (req, res) => {
    console.log(req.body)
    try {
        const result = await laddnings_station.addOne(req.body);
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});



router.post("/update", async (req, res) => {
    const update = await laddnings_station.update(req.body);
    console.log("Updating document:", req.body.id);
    console.log("Allowed users:", req.body.allowed_users);

    return res.status(201).json({ update });

});


router.get('/hierarchy', async (req, res) => {
    try {
        const data = await laddnings_station.getHierarchy();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});




router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const doc = await laddnings_station.getOne(id);

    return res.json({ doc });
});

router.get('/stations', async (_req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.json([]);

    const charging = await db.collection('chargingStations').find({}).limit(1000).toArray();
    const parking = await db.collection('parkingStations').find({}).limit(1000).toArray();

    const norm = (raw, type) => ({
      id: String(raw._id ?? raw.id ?? ''),
      city: raw.city ?? raw.stad ?? raw.cityName ?? raw.name ?? '—',
      type,
      capacity: Number(raw.capacity ?? raw.slots ?? raw.maxScooters ?? 0),
      location: raw.location ?? raw.position ?? raw.coordinates ?? raw.zone?.center ?? null,
    });

    return res.json([...charging.map((s) => norm(s, 'Charging')), ...parking.map((s) => norm(s, 'Parking'))]);
  } catch {
    return res.json([]);
  }
});

export default router;
