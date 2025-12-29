import express from 'express';

import userRouter from './v1/user.js';
import scootersRouter from './v1/elsparkcyklar.js';
import ridesRouter from './v1/ride.js';
import invoicesRouter from './v1/invoices.js'; // also hosts /reports (see file)

const app = express();

app.use(express.json());

// Minimal CORS (no extra dependency)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/v1/health', (req, res) => res.json({ ok: true }));

app.use('/v1', userRouter);
app.use('/v1', scootersRouter);
app.use('/v1', ridesRouter);
app.use('/v1', invoicesRouter);

export default app;