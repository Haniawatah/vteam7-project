//import openDb from './db/database.mjs';

import * as database from '../database.js'
import { ObjectId } from 'mongodb';

const laddnings_station = {
    getAll: async function getAll() {
        let db = await database.getDb();

        try {
            return await db.collections.laddningsStation.find().toArray();
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
            return await db.collections.laddningsStation.findOne({_id: new ObjectId(id)});
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


            return await db.collections.laddningsStation.insertOne({
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

            return await db.collections.laddningsStation.updateOne({_id: new ObjectId(body.id)},
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
            return await db.collections.laddningsStation.findOne({ namn });
        } catch (e) {
            console.error(e);
            return null;
        } finally {
            await db.client.close();
        }
    },

    getHierarchy: async function () {
        const db = await database.getDb();

        try {
            // Hämta alla städer
            const stader = await db.collections.städer.find().toArray();

            // Hämta alla laddningsstationer
            const stationer = await db.collections.laddningsStation.find().toArray();

            // Sätt ihop hierarkin: stad -> stationer -> elsparkcyklar
            const result = stader.map(stad => {
                // Hitta alla stationer i denna stad
                const stationerIStad = stationer
                    .filter(station => station.stad_id.toString() === stad._id.toString())
                    .map(station => ({
                        _id: station._id,
                        name: station.name,
                        zone: station.zone,
                        elsparkcyklar: station.elsparkcyklar || []
                    }));

                return {
                    _id: stad._id,
                    namn: stad.namn,
                    position: stad.position,
                    stationer: stationerIStad
                };
            });

            return result;

        } catch (e) {
            console.error(e);
            return [];
        } finally {
            db.client.close();
        }
    }

};





export default laddnings_station;
