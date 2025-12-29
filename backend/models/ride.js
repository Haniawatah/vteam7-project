import { ObjectId } from "../database.js";
import { setScooterStatus } from "./elsparkcykel.js";

export function toRideDto(doc) {
  return {
    id: String(doc._id),
    scooterId: doc.scooterId,
    userId: doc.userId,
    startTime: doc.startTime,
    endTime: doc.endTime,
    status: doc.status,
    date: doc.date || doc.startTime,
    duration: doc.duration,
    cost: doc.cost,
  };
}

export async function createRide(db, { scooterId, userId }) {
  const scooter = await db.collection("scooters").findOne({ _id: new ObjectId(scooterId) });
  if (!scooter) throw new Error("Scooter not found");
  if (scooter.status !== "available") throw new Error("Scooter not available");

  const now = new Date();
  const doc = {
    scooterId: String(scooterId),
    userId: String(userId),
    startTime: now,
    endTime: null,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  const res = await db.collection("rides").insertOne(doc);
  await setScooterStatus(db, scooterId, "rented");
  return toRideDto({ ...doc, _id: res.insertedId });
}

export async function getRideById(db, rideId) {
  const doc = await db.collection("rides").findOne({ _id: new ObjectId(rideId) });
  return doc ? toRideDto(doc) : null;
}

export async function listRideHistoryByUser(db, userId) {
  const docs = await db.collection("rides").find({ userId: String(userId) }).sort({ startTime: -1 }).toArray();
  return docs.map(toRideDto);
}

export async function endRide(db, { rideId, userId }) {
  const ride = await db.collection("rides").findOne({ _id: new ObjectId(rideId) });
  if (!ride) throw new Error("Ride not found");
  if (ride.userId !== String(userId)) throw new Error("Forbidden");
  if (ride.status !== "active") throw new Error("Ride already ended");

  const endTime = new Date();
  const minutes = Math.max(1, Math.ceil((endTime - new Date(ride.startTime)) / 60000));
  const cost = Number((minutes * 2.5).toFixed(2)); // simple pricing model

  await db.collection("rides").updateOne(
    { _id: new ObjectId(rideId) },
    {
      $set: {
        endTime,
        status: "ended",
        date: endTime,
        duration: minutes,
        cost,
        updatedAt: new Date(),
      },
    }
  );

  await setScooterStatus(db, ride.scooterId, "available");

  const updated = await db.collection("rides").findOne({ _id: new ObjectId(rideId) });
  return updated ? toRideDto(updated) : null;
}
