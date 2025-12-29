import dotenv from 'dotenv';
dotenv.config();

import app from './routes/app.js';
import { closeDb } from './database.js';
import { ensureAdminFromEnv } from './models/user.js';

const port = Number(process.env.PORT || 3000);

// CHANGE: keep a reference to the server + log bind errors (otherwise process may exit silently)
const server = app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});

server.on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exitCode = 1;
});

// CHANGE: graceful shutdown (also makes behavior deterministic in WSL/CI)
async function shutdown(signal) {
  try {
    console.log(`Shutting down (${signal})...`);
    await new Promise((resolve) => server.close(resolve));
    await closeDb();
  } catch (e) {
    console.error('Shutdown error:', e);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// CHANGE: ensure an admin user exists (no-op if env vars are missing)
ensureAdminFromEnv().catch((e) => {
  console.error('Admin seed failed:', e);
});

// If you had `export default app;` keep it:
export default app;