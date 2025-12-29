import { ObjectId } from 'mongodb';
import { getDb } from '../database.js';

const SCOOTERS = 'scooters';
const now = () => new Date();

const toScooter = (s) => ({
  id: String(s._id),
  model: s.model ?? '',
  status: s.status ?? 'available',
  latitude: typeof s.latitude === 'number' ? s.latitude : undefined,
  longitude: typeof s.longitude === 'number' ? s.longitude : undefined,
  location: s.location ?? undefined,
});

export async function listScooters() {
  const db = await getDb();
  const rows = await db.collection(SCOOTERS).find({}).toArray();
  return rows.map(toScooter);
}

export async function getScooter(id) {
  const db = await getDb();
  const row = await db.collection(SCOOTERS).findOne({ _id: new ObjectId(id) });
  return row ? toScooter(row) : null;
}

export async function createScooter(data) {
  const db = await getDb();
  const doc = {
    model: data?.model ?? 'Generic',
    status: data?.status ?? 'available',
    latitude: typeof data?.latitude === 'number' ? data.latitude : undefined,
    longitude: typeof data?.longitude === 'number' ? data.longitude : undefined,
    location: data?.location,
    createdAt: now(),
  };
  const { insertedId } = await db.collection(SCOOTERS).insertOne(doc);
  return await getScooter(insertedId);
}

export async function updateScooter(id, data) {
  const db = await getDb();
  await db.collection(SCOOTERS).updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...data, updatedAt: now() } }
  );
  return await getScooter(id);
}

export async function removeScooter(id) {
  const db = await getDb();
  await db.collection(SCOOTERS).deleteOne({ _id: new ObjectId(id) });
  return { ok: true };
}

export async function setScooterStatus(id, status) {
  const db = await getDb();
  await db.collection(SCOOTERS).updateOne(
    { _id: new ObjectId(id) },
    { $set: { status, updatedAt: now() } }
  );
}

// If your existing function is named `removeScooter`, keep it and export an alias:
export { removeScooter as deleteScooter };
