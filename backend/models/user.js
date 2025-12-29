//import openDb from './db/database.mjs';

import database from '../database.js'
import { ObjectId } from 'mongodb';

const users = {
    getAll: async function getAll() {
        let db = await database.getDb();

        try {
            return await db.collections.users.find().toArray();
        } catch (e) {
            console.error(e);

            return [];
        } finally {
            await db.client.close();
        }
    },

    getOne: async function getOne(email) {
        let db = await database.getDb();
        try {
            return await db.collections.users.findOne({ email: email });
        } catch (e) {
            console.error(e);

            return {};
        } finally {
            await db.client.close();
        }
    },

    register: async function addOne(body) {
        let db = await database.getDb();
        console.log(body.email)

        const userexist = await db.collections.users.findOne({ email: body.email });
        if (userexist) {
            return { error: "Email already registered" };
        }

        try {
            return await db.collections.users.insertOne({
                name: body.name,
                email: body.email,
                password: body.password,
                roll: body.roll || "user",
                wallet: body.wallet || 0,
                oauthProvider: body.oauthProvider || "normal"
            });
        } catch (e) {
            console.error(e);
        } finally {
            db.client.close();
        }
    },

};

export default users;
