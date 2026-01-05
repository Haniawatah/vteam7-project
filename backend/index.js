import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import v1 from './routes/app.js';
import { connectDb, seedBootstrap, tickSimulation } from './database.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// quick sanity check
app.get('/v1/health', (_req, res) => res.json({ ok: true }));

// IMPORTANT: mount all API routes under /v1
app.use('/v1', v1);

// error handler -> frontend gets JSON message (helps debugging)
app.use((err, _req, res, _next) => {
  const status = err?.status || 500;
  res.status(status).json({ message: err?.message || 'Server error' });
});

const port = Number(process.env.PORT || 3000);

(async () => {
  // Startar servern + kopplar DB + seedar basdata.
  // Viktigt: mount under /v1 eftersom frontend proxar /v1 -> backend:3000
  await connectDb();
  await seedBootstrap();

  // Simuleringstimer: uppdaterar scooter-position och batteri under aktiv resa
  const tickMs = Number(process.env.SIM_TICK_MS || 3000);
  setInterval(() => void tickSimulation(), Number.isFinite(tickMs) ? tickMs : 3000);

  app.listen(port, () => console.log(`Backend listening on http://localhost:${port}`));
})().catch((e) => {
  console.error('Fatal startup error:', e);
  process.exit(1);
});

export default app;