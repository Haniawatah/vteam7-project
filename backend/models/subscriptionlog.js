import { getDb } from '../database.js';
import { ObjectId } from 'mongodb';

// Get collection
export async function subscriptionLogCol() {
    const db = getDb();
    return db.collection('subscriptionLog');
}

// Get all subscription logs
export async function getAllSubscriptionLogs() {
    const col = await subscriptionLogCol();
    return col.find({}).toArray();
}

// Get one subscription log by ID
export async function getSubscriptionLog(id) {
    const col = await subscriptionLogCol();
    try {
        return await col.findOne({ _id: new ObjectId(id) });
    } catch (e) {
        console.error(e);
        return null;
    }
}

// Add a subscription log
export async function addSubscriptionLog({
    user_id,
    card_id = null,
    email = null,
    amount,
    date = new Date(),
    type,
}) {
    const col = await subscriptionLogCol();

    const doc = {
        user_id,
        card_id,
        email,
        amount,
        date,
        type,
    };

    const res = await col.insertOne(doc);
    return { ...doc, _id: res.insertedId };
}

// Update a subscription log
export async function updateSubscriptionLog({
    id,
    user_id,
    card_id,
    email,
    amount,
    date,
    type
}) {
    const col = await subscriptionLogCol();

    const updateObj = {
        $set: {
            ...(user_id && { user_id }),
            ...(card_id && { card_id }),
            ...(email && { email }),
            ...(amount !== undefined && { amount }),
            ...(date && { date }),
            ...(type && { type })
        }
    };

    await col.updateOne({ _id: new ObjectId(id) }, updateObj);
    return { success: true };
}

// Get logs for a specific user
export async function getSubscriptionLogsByUser(user_id) {
    const col = await subscriptionLogCol();
    return col.find({ user_id }).toArray();
}

// Default export (compatibility with old imports)
export default {
    getAll: getAllSubscriptionLogs,
    getOne: getSubscriptionLog,
    addOne: addSubscriptionLog,
    update: updateSubscriptionLog,
    getByUser: getSubscriptionLogsByUser
};
