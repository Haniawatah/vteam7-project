import 'dotenv/config';
import crypto from 'crypto';
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';

let client;
let _db;

const uri =
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  'mongodb://127.0.0.1:27017';

const dbName = process.env.MONGODB_DB || 'vteam7';

const MONGO_URL = uri;

async function ensureIndexes(db) {
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('sessions').createIndex({ token: 1 }, { unique: true });
  await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection('scooters').createIndex({ status: 1 });
  await db.collection('rides').createIndex({ userId: 1, startTime: -1 });
}

export async function getDb() {
  if (_db) return _db;

  client = new MongoClient(MONGO_URL, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
  });

  await client.connect();
  _db = client.db(dbName);

  await ensureIndexes(_db);
  return _db;
}

export async function closeDb() {
  if (client) await client.close();
  client = undefined;
  _db = undefined;
}

// Legacy/compat default export used by older models in this repo.
// NOTE: return a "client" with a no-op close() to avoid breaking the shared connection.
const database = {
  getDb: async function getDbLegacy() {
    const db = await getDb();
    return {
      client: { close: async () => {} },
      collections: {
        users: db.collection('users'),
        elsparkcyklar: db.collection('elsparkcyklar'),
        insättningar: db.collection('insättningar'),
        laddnings_station: db.collection('laddnings-station'),
        parkering_station: db.collection('parkering-station'),
        städer: db.collection('städer'),
        åktur: db.collection('åktur'),
      },
    };
  },
};

export const db = {
    scooters: [],
    rides: [],
    users: [],
    paymentsByUserId: new Map(),
};

export function ensureSeeded() {
    if (db.scooters.length) return;

    db.scooters.push(
        { id: crypto.randomUUID(), model: 'SE-100', latitude: 59.3293, longitude: 18.0686, status: 'available' },
        { id: crypto.randomUUID(), model: 'SE-200', latitude: 59.3393, longitude: 18.0586, status: 'available' }
    );

    db.users.push({ id: crypto.randomUUID(), name: 'Admin', email: 'admin@example.com', balance: 0 });
}

export { ObjectId };
export default database;
