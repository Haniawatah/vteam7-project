import { getDb } from '../database.js';
import { ObjectId } from 'mongodb';

// Use the logs collection
async function logsCol() {
    const db = await getDb();
    return db.collection('log');
}

// Fetch all logs
export async function getAllLogs() {
    const col = await logsCol();
    return col.find().toArray();
}

// Fetch a specific log by ID
export async function getLogById(id) {
    const col = await logsCol();
    return col.findOne({ _id: new ObjectId(id) });
}


export async function addLog(body) {
    try {
        const col = await logsCol();
        const res = await col.insertOne({
        user_id: body.user_id,
        scooterId: body.scooterId,
        start_location: body.start_location,
        end_location: body.end_location || [],
        start_time: body.start_time,
        end_time: body.end_time || 0,
        price: body.price || 0,
        speed: body.speed || 0,
        status: body.status || 'active'
        });
        return res.insertedId;
    } catch (e) {
        console.error('Error adding log:', e);
        throw e; // rethrow so calling code can handle
    }
}

// Update a log
export async function updateLog(body) {
    try {
        const col = await logsCol();
        return await col.updateOne(
        { _id: new ObjectId(body.logId) },
        { $set: {
            end_location: body.end_location,
            end_time: body.end_time,
            price: body.price,
            status: body.status
        }}
        );
    } catch (e) {
        console.error('Error updating log:', e);
        throw e;
    }
}

// Fetch logs by scooter
export async function getLogsByScooterId(scooterId) {
    try {
        const col = await logsCol();
        return await col.find({ scooterId: new ObjectId(scooterId) }).toArray();
    } catch (e) {
        console.error('Error fetching logs by scooter:', e);
        return [];
    }
}

// Fetch logs by user
export async function getLogsByUser(userId) {
    if (!userId) return [];
    try {
        const col = await logsCol();

        // ifall user_id är sparat som objectid
        let logs = await col.find({ user_id: new ObjectId(userId) }).toArray();
        if (logs.length > 0) return logs;

        // ifall user_id är sparat som string ------- Den här är den som är aktiv just nu när jag skrev det här
        //men behåller båda bara som "safety" så gammla logs fortfarande funkar
        logs = await col.find({ user_id: String(userId) }).toArray();
        return logs;
    } catch (e) {
        console.error('Error fetching logs by user:', e);
        return [];
    }
}


