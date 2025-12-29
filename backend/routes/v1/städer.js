import { Router } from 'express';
import { listCities } from '../../models/städer.js';

const router = Router();

// GET all cities
router.get('/cities', (req, res) => {
  res.json(listCities());
});

export default router;
