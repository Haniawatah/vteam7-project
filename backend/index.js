import dotenv from 'dotenv';
dotenv.config();

import app from './routes/app.js';

const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${PORT}`);
});