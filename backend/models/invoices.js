//import openDb from './db/database.mjs';

import database from '../database.js'
import { ObjectId } from 'mongodb';

const invoices = {
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
            return await db.collections.elsparkcyklar.updateOne({_id: new ObjectId(body.id)},
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
        return await db.collections.elsparkcyklar.find({ allowed_users: email }).toArray();
    } catch (e) {
        console.error(e);
        return [];
    } finally {
        await db.client.close();
    }
},

    listInvoicesByUser: async function listInvoicesByUser(userId) {
        let db = await database.getDb();
        const docs = await db.collection("invoices").find({ userId: String(userId) }).sort({ createdAt: -1 }).toArray();
        return docs.map((d) => ({
            id: String(d._id),
            userId: d.userId,
            amount: d.amount,
            date: d.date || d.createdAt,
            status: d.status || "issued",
        }));
    }
};

export async function listInvoicesForUser(userId) {
  // placeholder until invoices are implemented
  return [];
}

// Compatibility: some routes import this name
export async function listInvoicesByUser(userId) {
  return listInvoicesForUser(userId);
}

export default invoices;
