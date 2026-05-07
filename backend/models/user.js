import crypto from 'crypto';
import { getDb } from '../database.js';
import { ObjectId } from 'mongodb';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt] = stored.split(':');
  return hashPassword(String(password || ''), salt) === stored;
}


//For the card stuff to be safetly stored
function hashCardNumber(cardNumber, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.createHash('sha256').update(`${salt}:${cardNumber}`).digest('hex');
  return `${salt}:${hash}`;
}

function verifyCard(cardNumber, stored) { // eslint-disable-line no-unused-vars
  if (!stored || typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt] = stored.split(':');
  return hashCardNumber(cardNumber, salt) === stored;
}






export async function usersCol() {
  const db = getDb();
  const col = db.collection('users');

  // Keep compatible with an existing "email_1" index (no collation changes here)
  try {
    await col.createIndex({ email: 1 }, { unique: true, name: 'email_1' });
  } catch (e) {
    const codeName = e?.codeName;
    const code = e?.code;
    if (!(code === 86 || codeName === 'IndexKeySpecsConflict' || codeName === 'IndexOptionsConflict')) throw e;
  }

  return col;
}

export async function findUserByEmail(email) {
  const col = await usersCol();
  return col.findOne({ email: normalizeEmail(email) });
}

export async function createUser({ email, password, name = '', role = 'user' }) {
  const col = await usersCol();

  const doc = {
    email: normalizeEmail(email),
    name: String(name || ''),
    role: role === 'admin' ? 'admin' : 'user',
    passwordHash: hashPassword(String(password || '')),

    payment_information: {
      card_id: null,
      cardHash: null,
      last4: null,
      exp_date: null,
      enabled: null,
    },

    wallet: 0,
    subscription: {
      payment_card: null,
      status: 'inactive',
      monthlyFee: 0,
      lastBilled: null,
      nextBillingDate: null,
    },

    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const res = await col.insertOne(doc);
  return { ...doc, _id: res.insertedId };
}

export async function upsertAdminFromEnv() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const password = String(process.env.ADMIN_PASSWORD || '');
  if (!email || !password) return { ok: false, reason: 'ADMIN_EMAIL/ADMIN_PASSWORD not set' };

  const col = await usersCol();
  const existing = await col.findOne({ email });

  const existingSalt =
    typeof existing?.passwordHash === 'string' && existing.passwordHash.includes(':')
      ? existing.passwordHash.split(':')[0]
      : undefined;

  await col.updateOne(
    { email },
    {
      $set: {
        email,
        role: 'admin',
        passwordHash: hashPassword(password, existingSalt),
        updatedAt: new Date(),
      },
      $setOnInsert: { name: 'Admin', createdAt: new Date() },
    },
    { upsert: true }
  );

  const after = await col.findOne({ email });
  return { ok: true, email, role: after?.role ?? null };
}


export async function savePaymentMethod(userId, card) {
  const col = await usersCol();
  const cardId = new ObjectId();

  const cardData = {
    card_id: cardId,
    cardHash: hashCardNumber(card.number),
    last4: String(card.number).slice(-4),
    exp_date: card.exp_date,
    enabled: true,
  };

  const updateObj = {
    $set: { 
      payment_information: cardData,
      updatedAt: new Date(),
      'subscription.payment_card': cardId,
    },
  };


  await col.updateOne({ _id: new ObjectId(userId) }, updateObj);

  return { success: true, card_id: cardId };
}


//Uppdatera subscription
export async function updateSubscription(userId, sub, cardId = null) {
  const col = await usersCol();

  const updateObj = {
    'subscription.status': sub.status ?? 'inactive',
    'subscription.monthlyFee': sub.monthlyFee ?? 0,
    'subscription.lastBilled': sub.lastBilled ?? null,
    'subscription.nextBillingDate': sub.nextBillingDate ?? null,
  };

  if (cardId) updateObj['subscription.payment_card'] = cardId;

  await col.updateOne({ _id: new ObjectId(userId) }, { $set: updateObj });

  const updatedUser = await col.findOne(
    { _id: new ObjectId(userId) },
    { projection: { subscription: 1 } }
  );

  return updatedUser?.subscription ?? null;
}


export async function getSubscription(userId) {
  const col = await usersCol();

  const user = await col.findOne(
    { _id: new ObjectId(userId) },
    { projection: { subscription: 1 } }
  );

  return user?.subscription ?? null;
}



export async function getPaymentInfo(userId) {
  const col = await usersCol();

  const user = await col.findOne(
    { _id: new ObjectId(userId) },
    { projection: { payment_information: 1 } }
  );

  return user?.payment_information ?? null;
}



//Pengar saker
export async function addMoney(userId, amount) {
  const col = await usersCol();

  await col.updateOne(
    { _id: new ObjectId(userId) },
    {
      $inc: { wallet: amount },
      $set: { updatedAt: new Date() },
    }
  );

  return { success: true };
}


//Ta bort pengar
export async function removeMoney(userId, amount) {
    const walletBalance = await getWallet(userId);

    //DubbelCheck så vi inte kan få negativt
    if (walletBalance < amount) {
        throw new Error('Insufficient funds');
    }

    const col = await usersCol();
    await col.updateOne(
        { _id: new ObjectId(userId) },
        {
            $inc: { wallet: -amount },
            $set: { updatedAt: new Date() },
        }
    );

    return { success: true };
}


export async function getWallet(userId) {
  const col = await usersCol();

  const user = await col.findOne(
    { _id: new ObjectId(userId) },
    { projection: { wallet: 1 } }
  );

  return user?.wallet ?? 0;
}












export function toPublicUser(u) {
  if (!u) return null;

  const latestCard = (u.payment_information ?? []);

  const subscription = (u.subscription ?? []);


  return {
    id: String(u._id),
    email: u.email,
    name: u.name,
    role: u.role,
    wallet: u.wallet ?? 0,
    last4: latestCard.last4 ?? null,
    enabled: latestCard.enabled,
    exp_date: latestCard.exp_date ?? null,
    subscription: subscription
  };
}

export function checkPassword(u, password) {
  return verifyPassword(password, u?.passwordHash);
}

/**
 * Compatibility layer for older routes that still do:
 *   import user from '../models/user.js'
 *   await user.getAll(), await user.getOne(), await user.register()
 */
async function getAll() {
  const col = await usersCol();
  const rows = await col.find({}).toArray();
  return rows.map(toPublicUser);
}

async function getOne(email) {
  const u = await findUserByEmail(email);
  return toPublicUser(u);
}

async function register(email, password, name) {
  const existing = await findUserByEmail(email);
  if (existing) return null;
  const created = await createUser({ email, password, name, role: 'user' });
  return toPublicUser(created);
}

export default { getAll, getOne, register, savePaymentMethod, addMoney, getSubscription, getPaymentInfo, updateSubscription };
