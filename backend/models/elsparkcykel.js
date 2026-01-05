//import openDb from './db/database.mjs';

import { ObjectId } from 'mongodb';

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




