//import openDb from './db/database.mjs';

import * as database from '../database.js'
import { ObjectId } from 'mongodb';

const ParkeringStation = {
    getAll: async function getAll() {
        let db = await database.getDb();
        console.log(db.databaseName);  // This should print the correct database name
        console.log(Object.keys(db.collections)); 

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
            //Hittar iden som passar med staden
            const stadName = await db.collections.städer.findOne(
                { namn: body.stad },
                {
                    collation: { locale: "sv", strength: 2 }
                }
            );


            return await db.collections.parkeringStation.insertOne({
                name: body.name,
                stad_id: stadName._id,
                zone: body.zone || {},
                elsparkcyklar: body.elsparkcyklar || {}
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
            //Hittar iden som passar med staden
            const stadName = await db.collections.städer.findOne(
                { namn: body.stad },
                {
                    collation: { locale: "sv", strength: 2 }
                }
            );

            return await db.collections.parkeringStation.updateOne({_id: new ObjectId(body.id)},
            { $set: { 
                name: body.name,
                stad_id: stadName._id,
                zone: body.zone,
                elsparkcyklar: body.elsparkcyklar
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
            return await db.collections.parkeringStation.findOne({ namn });
        } catch (e) {
            console.error(e);
            return null;
        } finally {
            await db.client.close();
        }
    }

};

export default ParkeringStation;
