import 'dotenv/config';
import app from './server.js';
import { connectDb, seedBootstrap, tickSimulation } from './database.js';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

(async () => {
    try {
        await connectDb();
        await seedBootstrap();
        setInterval(() => void tickSimulation(), Number(process.env.SIM_TICK_MS || 3000));

        app.listen(PORT, HOST, () => {
        console.log(`Backend listening on http://${HOST}:${PORT}`);
        });
    } catch (err) {
        console.error('Fatal startup error:', err);
        process.exit(1);
    }
})();