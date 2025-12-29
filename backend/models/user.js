//import openDb from './db/database.mjs';

import database, { ObjectId } from '../database.js'
import crypto from "crypto";

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

        const userexist = await db.collections.users.findOne({ email: body.email });
        if (userexist) {
            return { error: "Email already registered" };
        }

        try {
            return await db.collections.users.insertOne({
                name: body.name,
                email: body.email,
                password: body.password
            });
        } catch (e) {
            console.error(e);
        } finally {
            db.client.close();
        }
    },

    async createUser(db, { email, password, name, role = "user" }) {
        const now = new Date();
        const doc = {
            email: String(email).toLowerCase().trim(),
            passwordHash: hashPassword(String(password)),
            name: name || "",
            role,
            balance: 0,
            payment: { last4: null, expiryDate: "" },
            createdAt: now,
            updatedAt: now,
        };
        const res = await db.collection("users").insertOne(doc);
        return { ...doc, _id: res.insertedId };
    },

    async authenticateUser(db, { email, password }) {
        const user = await findUserByEmail(db, email);
        if (!user) return null;
        if (!verifyPassword(password, user.passwordHash)) return null;
        return user;
    },

    async createSession(db, userId) {
        const token = crypto.randomBytes(32).toString("base64url");
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        await db.collection("sessions").insertOne({ token, userId: String(userId), createdAt: now, expiresAt });
        return token;
    },

    async deleteSession(db, token) {
        await db.collection("sessions").deleteOne({ token });
    },

    async getUserDocByToken(db, token) {
        const session = await db.collection("sessions").findOne({ token });
        if (!session) return null;
        try {
            return await db.collection("users").findOne({ _id: new ObjectId(session.userId) });
        } catch {
            return null;
        }
    },

    async listUsers(db) {
        const docs = await db.collection("users").find({}).sort({ createdAt: -1 }).toArray();
        return docs.map(toUserDto);
    },

    async getPaymentInfo(db, userId) {
        const doc = await db.collection("users").findOne({ _id: new ObjectId(userId) });
        const last4 = doc?.payment?.last4 || null;
        const expiryDate = doc?.payment?.expiryDate || "";
        return { cardNumber: maskCard(last4), expiryDate, cvv: "" };
    },

    async updatePaymentInfo(db, userId, { cardNumber, expiryDate }) {
        const digits = String(cardNumber || "").replace(/\D/g, "");
        const last4 = digits.slice(-4) || null;

        await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    "payment.last4": last4,
                    "payment.expiryDate": String(expiryDate || ""),
                    updatedAt: new Date(),
                },
            }
        );

        return { cardNumber: maskCard(last4), expiryDate: String(expiryDate || ""), cvv: "" };
    },
};

function toUserDto(doc) {
    return {
        id: String(doc._id),
        email: doc.email,
        name: doc.name || "",
        role: doc.role || "user",
        balance: Number(doc.balance || 0),
    };
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16);
    const hash = crypto.scryptSync(password, salt, 64);
    return `${salt.toString("base64")}:${hash.toString("base64")}`;
}

function verifyPassword(password, stored) {
    const [saltB64, hashB64] = String(stored || "").split(":");
    if (!saltB64 || !hashB64) return false;
    const salt = Buffer.from(saltB64, "base64");
    const hash = Buffer.from(hashB64, "base64");
    const test = crypto.scryptSync(password, salt, 64);
    return hash.length === test.length && crypto.timingSafeEqual(hash, test);
}

async function findUserByEmail(db, email) {
    return db.collection("users").findOne({ email: String(email).toLowerCase().trim() });
}

function maskCard(last4) {
    return last4 ? `**** **** **** ${last4}` : "";
}

export default users;
