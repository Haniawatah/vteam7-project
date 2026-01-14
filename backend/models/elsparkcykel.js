//import openDb from './db/database.mjs';

import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

import { getDb } from '../database.js';

export async function scootersCol() {
    const db = await getDb();
    return db.collection('scooters');
}

//Lista av elsparkcyklarna
export async function getAllScooters() {
    const col = await scootersCol();
    return col.find({}).toArray();
}

export async function getScooterById(id) {
    const col = await scootersCol();
    return col.findOne({ _id: new ObjectId(id) });
}

export async function getScooterByName(name) {
    const col = await scootersCol();
    return col.findOne({ name });
}

export async function addScooter(body) {
    const col = await scootersCol();
    return col.insertOne({
        name: body.name,
        position: body.position ?? [],
        status: body.status,
        battery: body.battery,
        city: body.city,
        logs: body.logs ?? [],
        createdAt: new Date(),
        updatedAt: new Date(),
        rentedBy: null
    });
}

export async function updateScooter(body) {
    const col = await scootersCol();
    return col.updateOne(
        { _id: new ObjectId(body.id) },
        {
            $set: {
                name: body.name,
                position: body.position,
                status: body.status,
                battery: body.battery,
                logs: body.logs,
                updatedAt: new Date(),
            },
        }
    );
}

export async function updateScooterPosition(scooterId, position) {
    const col = await scootersCol();
    return col.updateOne(
        { _id: new ObjectId(scooterId) },
        {
            $set: {
                position,
                updatedAt: new Date(),
            },
        }
    );
}


export async function updateScooterStatus(scooterId, status) {
    try {
        const col = await scootersCol();
        const result = await col.updateOne(
        { _id: new ObjectId(scooterId) },
        { $set: { status } }
        );
        return result;
    } catch (e) {
        console.error('Error updating scooter status:', e);
        throw e;
    }
}


//För om en användare har en scooter
export async function userHasActiveScooter(userId) {
    const col = await scootersCol();
    return col.findOne({
        rentedBy: new ObjectId(userId),
        status: 'InUse',
    });
}


//Uppdaterar så att man ser vem som hyrde scootern
export async function updateScooterUser(scooterId, userId, status) {
    const col = await scootersCol();

    const result = await col.updateOne(
        {
            _id: new ObjectId(scooterId),
            status: 'Available',
        },
        {
            $set: {
                status: status,
                rentedBy: new ObjectId(userId),
                updatedAt: new Date(),
            },
        }
    );

    return result.modifiedCount === 1;
}

//Visar scootrarna vi vill se
export async function getScootersForMap(userId) {
    const col = await scootersCol();

    return col.find({
        $or: [
            { status: 'Available' },
            { rentedBy: new ObjectId(userId) },
        ],
    }).toArray();
}




//Lägger till ifall tom
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
        rentedBy: null
    },
    {
        name: 'SCOOTER-002',
        battery: 41,
        status: 'InUse',
        city: 'Stockholm',
        position: [59.334, 18.06],
        createdAt: now,
        updatedAt: now,
        rentedBy: null
    },
    {
        name: 'SCOOTER-003',
        battery: 15,
        status: 'Maintenance',
        city: 'Stockholm',
        position: [59.325, 18.075],
        createdAt: now,
        updatedAt: now,
        rentedBy: null
    },
    ];

    const res = await col.insertMany(seed);
    return { ok: true, seeded: res.insertedCount };
}

const ElsparkcykelSchema = new mongoose.Schema(
  {
    id: { type: String, index: true, unique: true, sparse: true },
    model: { type: String, default: 'GEN' },
    city: { type: String, default: 'Stockholm' },
    status: { type: String, default: 'Available' },
    batteryLevel: { type: Number, default: 100 },
    location: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Elsparkcykel || mongoose.model('Elsparkcykel', ElsparkcykelSchema);




