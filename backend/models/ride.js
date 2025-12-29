import { ObjectId } from 'mongodb';
import { getDb } from '../database.js';
import { setScooterStatus } from './elsparkcykel.js';

const RIDES = 'rides';
const now = () => new Date();

const toRide = (r) => ({
  id: String(r._id),
  scooterId: String(r.scooterId),
  userId: r.userId ? String(r.userId) : undefined,
  startTime: r.startTime,
  endTime: r.endTime,
  status: r.status,
  date: r.startTime,
  duration: typeof r.duration === 'number' ? r.duration : undefined,
  cost: typeof r.cost === 'number' ? r.cost : undefined,
});

export async function createRide({ userId, scooterId }) {
  const db = await getDb();

  const doc = {
    userId: new ObjectId(userId),
    scooterId: new ObjectId(scooterId),
    startTime: now(),
    status: 'active',
  };

  const { insertedId } = await db.collection(RIDES).insertOne(doc);
  await setScooterStatus(scooterId, 'rented');

  const ride = await db.collection(RIDES).findOne({ _id: insertedId });
  return toRide(ride);
}

export async function getActiveRide(rideId, userId) {
  const db = await getDb();
  const ride = await db.collection(RIDES).findOne({
    _id: new ObjectId(rideId),
    userId: new ObjectId(userId),
    status: 'active',
  });
  return ride ? toRide(ride) : null;
}

export async function endRide(rideId, userId) {
  const db = await getDb();
  const ride = await db.collection(RIDES).findOne({
    _id: new ObjectId(rideId),
    userId: new ObjectId(userId),
    status: 'active',
  });
  if (!ride) return null;

  const endTime = now();
  const mins = Math.max(1, Math.round((endTime - new Date(ride.startTime)) / 60000));
  const cost = mins * 1; // simple SEK/whatever per minute

  await db.collection(RIDES).updateOne(
    { _id: ride._id },
    { $set: { endTime, status: 'ended', duration: mins, cost } }
  );

  await setScooterStatus(String(ride.scooterId), 'available');

  const updated = await db.collection(RIDES).findOne({ _id: ride._id });
  return toRide(updated);
}

export async function getRideHistory(userId) {
  const db = await getDb();
  const rides = await db
    .collection(RIDES)
    .find({ userId: new ObjectId(userId) })
    .sort({ startTime: -1 })
    .toArray();
  return rides.map(toRide);
}

export async function getReports() {
  const db = await getDb();
  const rides = await db.collection(RIDES).find({ status: 'ended' }).sort({ startTime: -1 }).limit(200).toArray();
  return rides.map((r) => ({
    id: String(r._id),
    user: r.userId ? String(r.userId) : '—',
    rideDuration: Number(r.duration ?? 0),
    date: r.startTime ?? null,
  }));
}

// --- Compatibility exports expected by some route versions ---
// Implemented with dynamic imports to avoid duplicate top-level imports.

const _fallbackToRide = (r) => ({
  id: String(r._id),
  scooterId: r.scooterId ? String(r.scooterId) : undefined,
  userId: r.userId ? String(r.userId) : undefined,
  startTime: r.startTime ?? null,
  endTime: r.endTime ?? null,
  status: r.status ?? null,
  date: r.startTime ?? null,
  duration: typeof r.duration === 'number' ? r.duration : undefined,
  cost: typeof r.cost === 'number' ? r.cost : undefined,
});

export async function getRideById(rideId, userId) {
  const [{ ObjectId }, { getDb }] = await Promise.all([
    import('mongodb'),
    import('../database.js'),
  ]);

  const db = await getDb();
  const query = { _id: new ObjectId(rideId) };
  if (userId) query.userId = new ObjectId(userId);

  const ride = await db.collection('rides').findOne(query);
  if (!ride) return null;

  const mapper = typeof toRide === 'function' ? toRide : _fallbackToRide; // `typeof` is safe even if `toRide` is not declared
  return mapper(ride);
}

export async function listRideHistoryByUser(userId) {
  const [{ ObjectId }, { getDb }] = await Promise.all([
    import('mongodb'),
    import('../database.js'),
  ]);

  const db = await getDb();
  const rides = await db
    .collection('rides')
    .find({ userId: new ObjectId(userId) })
    .sort({ startTime: -1 })
    .toArray();

  const mapper = typeof toRide === 'function' ? toRide : _fallbackToRide;
  return rides.map(mapper);
}
