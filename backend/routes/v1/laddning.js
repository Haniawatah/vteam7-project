import { Router } from 'express';
import { listChargingStations } from '../../models/laddnings-stationer.js';

const router = Router();

// GET all charging stations
router.get('/charging-stations', (req, res) => {
  res.json(listChargingStations());
});

export default router;
