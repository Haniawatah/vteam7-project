//import openDb from './db/database.mjs';

import database from '../database.js'
import rideLog from '../models/ride.js';
import { ObjectId } from 'mongodb';

const elsparkcyklar = {
    getAll: async function getAll() {
        let db = await database.getDb();

        try {
            return await db.collections.elsparkcyklar.find().toArray();
        } catch (e) {
            console.error(e);

            return [];
        } finally {
            await db.client.close();
        }
    },

    getOne: async function getOne(id) {
        let db = await database.getDb();
        try {
            return await db.collections.elsparkcyklar.findOne({_id: new ObjectId(id)});
        } catch (e) {
            console.error(e);

            return {};
        } finally {
            await db.client.close();
        }
    },

    addOne: async function addOne(body) {
        let db = await database.getDb();

        try {
            return await db.collections.elsparkcyklar.insertOne({
                name: body.name,
                position: body.position|| [],
                status: body.status,
                battery: body.battery,
                logs: body.logs|| []
            });
        } catch (e) {
            console.error(e);
        } finally {
            db.client.close();
        }
    },

    update: async function update(body) {
        let db = await database.getDb();

        console.log(body.content);

        try {
            return await db.collections.elsparkcyklar.updateOne({_id: new ObjectId(body.id)},
            { $set: { 
                name: body.name,
                position: body.position,
                status: body.status,
                battery: body.battery,
                logs: body.logs
            } });
        } catch (e) {
            console.error(e);
        } finally {
            await db.client.close();
        }
    },

    getByName: async function getOne(bikeName) {
        let db = await database.getDb();
        try {
            return await db.collections.elsparkcyklar.findOne({name: bikeName});
        } catch (e) {
            console.error(e);

            return {};
        } finally {
            await db.client.close();
        }
    },

    updatePosition: async function (scooterId, position) {
    let db = await database.getDb();
    try {
        return await db.collections.elsparkcyklar.updateOne(
            { _id: new ObjectId(scooterId) },
            { $set: { position: position } }
        );
    } catch (e) {
        console.error(e);
    } finally {
        await db.client.close();
    }
    },

    startLog: async function (scooterId, body) {
        let db = await database.getDb();
        try {
            // Create a new log entry with start details
            const newLog = {
                log_id: body._id.toString(),
                user_id: body.user_id,
                scooterId: body.scooterId,
                start_location: body.start_location,
                end_location: body.end_location || [],
                start_time: body.start_time,
                end_time: body.end_time || 0,
                price: body.price || 0,
                speed: body.speed || 0,
                status: body.status || 'active'
            };

            // Push the new log into the scooter's logs array
            return await db.collections.elsparkcyklar.updateOne(
                { _id: new ObjectId(scooterId) },
                { $push: { logs: newLog } }
            );
        } catch (e) {
            console.error(e);
        } finally {
            await db.client.close();
        }
    },

    endLog: async function (scooterId, body) {
        let db = await database.getDb();
        try {
            // Ensure that scooterId is an ObjectId
            const objectId = new ObjectId(scooterId);

            console.log("sssssssssssssssssss");
            console.log(body.logId);

            // Updaterar en specifik log för en elsparkcykel
            const result = await db.collections.elsparkcyklar.updateOne(
                { 
                    _id: objectId,
                    "logs.log_id": body.logId
                },
                {
                    $set: {
                        "logs.$.end_location": body.end_location,
                        "logs.$.end_time": body.end_time,
                        "logs.$.price": body.price,
                        "logs.$.status": "Completed"
                    }
                }
            );

            console.log(result);

            return result;

        } catch (e) {
            console.error(e);
        } finally {
            await db.client.close();
        }
    }



};

export default elsparkcyklar;

import { getDb } from '../database.js';

export async function scootersCol() {
  const db = await getDb();
  return db.collection('scooters');
}

export async function listScooters() {
  const col = await scootersCol();
  return col.find({}).toArray();
}

export async function seedScootersIfEmpty() {
  const col = await scootersCol();
  const count = await col.countDocuments();
  if (count > 0) return { ok: true, seeded: 0 };

  const now = new Date();
  const seed = [
    {
      name: 'SCOOTER-001',
      battery: 82,
      status: 'Available',
      city: 'Stockholm',
      position: [59.3293, 18.0686],
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'SCOOTER-002',
      battery: 41,
      status: 'InUse',
      city: 'Stockholm',
      position: [59.334, 18.06],
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'SCOOTER-003',
      battery: 15,
      status: 'Maintenance',
      city: 'Stockholm',
      position: [59.325, 18.075],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const res = await col.insertMany(seed);
  return { ok: true, seeded: res.insertedCount };
}
