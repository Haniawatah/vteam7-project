import 'dotenv/config';

import { MongoClient, ServerApiVersion } from 'mongodb';

let clientPromise;
let dbPromise;

export async function getDb() {
  if (!dbPromise) {
    const url = process.env.MONGODB_URL || process.env.DATABASE_URL;
    const dbName = process.env.MONGODB_DB || 'vteam7';

    if (!url) {
      throw new Error('Missing MONGODB_URL (or DATABASE_URL) in backend/.env');
    }

    clientPromise = clientPromise ?? new MongoClient(url).connect();
    dbPromise = (await clientPromise).db(dbName);
  }
  return dbPromise;
}

// Backwards-compatible default export for older modules doing:
//   import database from '../database.js'
//   const db = await database.getDb()
export default { getDb };

let client;
let db;

export async function initDb() {
  if (db) return db;

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || '';
  const dbName = process.env.MONGODB_DB || process.env.MONGO_DB || 'vteam7';

  if (!uri) return null; // allow running without DB for endpoint-shape testing

  client = client ?? new MongoClient(uri);
  if (!client.topology?.isConnected?.()) {
    await client.connect();
  }
  db = client.db(dbName);
  return db;
}
