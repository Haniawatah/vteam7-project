//import openDb from './db/database.mjs';

import * as database from '../database.js'
import { ObjectId } from 'mongodb';

const städer = {
    getAll: async function getAll() {
        let db = await database.getDb();

        try {
            return await db.collections.städer.find().toArray();
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
            return await db.collections.städer.findOne({_id: new ObjectId(id)});
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
            return await db.collections.städer.insertOne({
                name: body.name,
                position: body.positions
            });
        } catch (e) {
            console.error(e);
        } finally {
            db.client.close();
        }
    },

    update: async function update(body) {
        let db = await database.getDb();

        try {
            return await db.collections.städer.updateOne({_id: new ObjectId(body.id)},
            { $set: { 
                name: body.name,
                position: body.positions
            } });
        } catch (e) {
            console.error(e);
        } finally {
            await db.client.close();
        }
    },

    getByName: async function (namn) {
        let db = await database.getDb();

        try {
            return await db.collections.städer.findOne({ namn });
        } catch (e) {
            console.error(e);
            return null;
        } finally {
            await db.client.close();
        }
    }

};

export default städer;
