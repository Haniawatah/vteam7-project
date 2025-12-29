//import openDb from './db/database.mjs';

import database from '../database.js'
import { ObjectId } from 'mongodb';

const parkering_Station = {
    getAll: async function getAll() {
        let db = await database.getDb();

        try {
            return await db.collections.parkeringStation.find().toArray();
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
            return await db.collections.parkeringStation.findOne({_id: new ObjectId(id)});
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
            return await db.collections.parkeringStation.insertOne({
                title: body.title,
                content: body.content,
                allowed_users: body.allowed_users || []
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
            return await db.collections.parkeringStation.updateOne({_id: new ObjectId(body.id)},
            { $set: { 
                title: body.title, 
                content: body.content,
                allowed_users: body.allowed_users
            } });
        } catch (e) {
            console.error(e);
        } finally {
            await db.client.close();
        }
    },

    getByUser: async function getByUser(email) {
    let db = await database.getDb();
    try {
        return await db.collections.parkeringStation.find({ allowed_users: email }).toArray();
    } catch (e) {
        console.error(e);
        return [];
    } finally {
        await db.client.close();
    }
},

    listParkingStations: async function listParkingStations() {
        let db = await database.getDb();
        const docs = await db.collection("parkingStations").find({}).toArray();
        return docs.map((d) => ({
            id: String(d._id),
            name: d.name,
            latitude: d.latitude,
            longitude: d.longitude,
        }));
    }
};

export default parkering_Station;
