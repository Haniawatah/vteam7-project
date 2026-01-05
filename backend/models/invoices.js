import { getDb } from '../database.js';
import { ObjectId } from 'mongodb';

export async function invoicesCol() {
    const db = await getDb();
    return db.collection('invoices');
}

// Get all invoices
export async function getAllInvoices() {
    const col = await invoicesCol();
    return col.find({}).toArray();
}

// Get invoice by ID
export async function getInvoice(id) {
    const col = await invoicesCol();
    try {
        return await col.findOne({ _id: new ObjectId(id) });
    } catch (e) {
        console.error(e);
        return null;
    }
}

// Add a new invoice
export async function addInvoice({ user_id, money, date = new Date(), payment_method, status }) {
    const col = await invoicesCol();
    const doc = {
        user_id,
        money,
        date,
        payment_method,
        status
    };
    const res = await col.insertOne(doc);
    return { ...doc, _id: res.insertedId };
}

// Update an invoice (if needed)
export async function updateInvoice({ id, money, date, payment_method, status }) {
    const col = await invoicesCol();
    const updateObj = {
        $set: {
        ...(money !== undefined && { money }),
        ...(date && { date }),
        ...(payment_method && { payment_method }),
        ...(status && { status }),
        },
    };
    await col.updateOne({ _id: new ObjectId(id) }, updateObj);
    return { success: true };
}

// Get invoices for a specific user
export async function getInvoicesByUser(user_id) {
    const col = await invoicesCol();
    return col.find({ user_id }).toArray();
}

export default {
    getAll: getAllInvoices,
    getOne: getInvoice,
    addOne: addInvoice,
    update: updateInvoice,
    getByUser: getInvoicesByUser,
};
