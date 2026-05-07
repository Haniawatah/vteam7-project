import express from 'express';
import cors from 'cors';
import v1 from './routes/app.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// quick sanity check
app.get('/v1/health', (_req, res) => res.json({ ok: true }));

// mount all API routes under /v1
app.use('/v1', v1);

// error handler
app.use((err, _req, res) => {
    const status = err?.status || 500;
    res.status(status).json({ message: err?.message || 'Server error' });
});

export default app;
