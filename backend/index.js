import 'dotenv/config';
import express from 'express';
import v1Routes from './routes/app.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// minimal CORS for local dev
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
});

app.get('/', (req, res) => {
    res.type('text').send('Backend is running. Try /v1/health');
});

app.get('/v1/health', (req, res) => res.json({ ok: true }));

app.use('/v1', v1Routes);

app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
});


const server = app.listen(port, () => console.log(`Backend listening on http://localhost:${port}`));

export default server;