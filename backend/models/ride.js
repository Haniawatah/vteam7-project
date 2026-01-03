import { getDb } from '../database.js';
import { ObjectId } from 'mongodb';

const rideLog = {
    // Fetch all ride logs
    getAll: async function getAll() {
        let db = await getDb();
        try {
            return await db.collections.log.find().toArray();
        } catch (e) {
            console.error(e);
            return [];
        } finally {
            await db.client.close();
        }
    },

    // Fetch a specific ride log by ID
    getOne: async function getOne(id) {
        let db = await getDb();
        try {
            return await db.collections.log.findOne({ _id: new ObjectId(id) });
        } catch (e) {
            console.error(e);
            return {};
        } finally {
            await db.client.close();
        }
    },

    // Add a new ride log
    addOne: async function addOne(body) {
        let db = await getDb();
        try {
            return await db.collections.log.insertOne({
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
        } catch (e) {
            console.error("Error adding log:", e);
        } finally {
            db.client.close();
        }
    },

    // Update an existing log entry
    updateLog: async function updateLog(body) {
        let db = await getDb();
        try {
            console.log(body);
            console.log("--------------t-tt")
            return await db.collections.log.updateOne(
                { _id: new ObjectId(body.logId) },
                { $set: { 
                    end_location: body.end_location,
                    end_time: body.end_time,
                    price: body.price,
                    status: body.status
                }}
            );
        } catch (e) {
            console.error("Error updating log:", e);
        } finally {
            db.client.close();
        }
    },

    // Fetch logs for a specific scooter (using scooter ID)
    getByScooterId: async function getByScooterId(scooterId) {
        let db = await getDb();
        try {
            return await db.collections.log.find({ scooterId }).toArray();
        } catch (e) {
            console.error(e);
            return [];
        } finally {
            await db.client.close();
        }
    },

    getByUser: async function getByUser(user) {
    let db = await getDb();
    try {
        return await db.collections.log.find({ user_id: user }).toArray();
    } catch (e) {
        console.error(e);
        return [];
    } finally {
        await db.client.close();
    }
}
};

export default rideLog;
