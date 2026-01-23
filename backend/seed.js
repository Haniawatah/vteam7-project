import 'dotenv/config';
import crypto from 'crypto';
import { MongoClient } from 'mongodb';

const CENTER = { lat: 59.3293, lng: 18.0686 };
const COUNT = 50;

function mustGetMongoUri() {
  return process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI || '';
}

function jitter(delta) {
  return (Math.random() - 0.5) * delta;
}

function makeScooter(i) {
  const id = `SCOOT-${String(i).padStart(3, '0')}-${crypto.randomUUID().slice(0, 8)}`;
  return {
    id,
    status: 'Available',
    batteryLevel: 100,
    city: 'Stockholm',
    location: {
      lat: CENTER.lat + jitter(0.06),
      lng: CENTER.lng + jitter(0.10),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Skapar en enkel testflotta av scooters runt Stockholm
// OBS: Den här seed:en kan köras flera gånger (tar bort tidigare seedade med samma id-prefix)
async function main() {
  const uri = mustGetMongoUri();
  if (!uri) throw new Error('Missing MongoDB connection string (set MONGODB_URI or DATABASE_URL).');

  const dbName = process.env.MONGODB_DB || undefined;

  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = dbName ? client.db(dbName) : client.db();
    const scooters = db.collection('scooters');

    const docs = Array.from({ length: COUNT }, (_, idx) => makeScooter(idx + 1));

    // Gör omkörningar deterministiska-ish: ta bort tidigare seedade docs (id-prefix)
    await scooters.deleteMany({ id: /^SCOOT-\d{3}-/ });

    const res = await scooters.insertMany(docs, { ordered: false });
    // eslint-disable-next-line no-console
    console.log(`Seeded scooters: ${res.insertedCount}`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', err?.message ?? err);
  process.exitCode = 1;
});
