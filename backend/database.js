import 'dotenv/config';
import crypto from 'crypto';
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';

const database = {
    getDb: async function getDb () {
    let dsn = `mongodb+srv://tiae24_db_user:${process.env.DB_PASS}@cluster0.5s8wzba.mongodb.net/vteam?retryWrites=true&w=majority&appName=text-editor&tls=true`;


        //if (process.env.NODE_ENV === 'test') {
        //    dsn = "mongodb://localhost:27017/test";
        //    console.log("hejsan")
        //}

        const client = new MongoClient(dsn, {
            serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
        });
        const db = await client.db("vteam");

        return {
            client,
            collections: {
                users: db.collection("users"),
                elsparkcyklar: db.collection("elsparkcyklar"),
                insättningar: db.collection("insättningar"),
                laddnings_station: db.collection("laddnings-station"),
                parkering_station: db.collection("parkering-station"),
                städer: db.collection("städer"),
                åktur: db.collection("åktur")
            }
        };
    }
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

async function ensureIndexes(database) {
  await database.collection("users").createIndex({ email: 1 }, { unique: true });
  await database.collection("sessions").createIndex({ token: 1 }, { unique: true });
  await database.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await database.collection("scooters").createIndex({ status: 1 });
  await database.collection("rides").createIndex({ userId: 1, startTime: -1 });
}

export async function getDb() {
  if (db) return db;
  client = new MongoClient(MONGO_URL);
  await client.connect();
  db = client.db(MONGO_DB);
  await ensureIndexes(db);
  return db;
}

export { ObjectId };
export default database;
