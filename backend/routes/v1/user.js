import express from 'express';
import user from '../../models/user.js';
import invoices from '../../models/invoices.js';
import subscriptionLog from '../../models/subscriptionlog.js';

import { ObjectId } from 'mongodb';

import { toPublicUser, getWallet } from "../../models/user.js";

import { checkToken } from '../../middleware/utils.js';
import { signToken } from '../../middleware/signtoken.js';
import { getDb } from '../../database.js';
import requireAdminDefault, { requireAdmin as requireAdminNamed } from '../../middleware/admin.js';
import { authenticate } from '../../middleware/passport.js';

const router = express.Router();

router.use(checkToken);

const requireAdmin =
  typeof requireAdminDefault === 'function'
    ? requireAdminDefault
    : typeof requireAdminNamed === 'function'
      ? requireAdminNamed
      : null;

// GET all users
router.get('/', async (req, res) => {
    const data = await user.getAll();
    res.status(200).json(data);
});


router.post("/register", async (req, res) => {
    console.log(req)
    const result = await user.register(req.body);
    res.status(201).json({ result });
});



router.get('/profile', async (req, res) => {
    const userEmail = req.user.email;

    console.log(req.user, "users")

    const data = await user.getOne(userEmail);
    
    if (!data) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }


    res.status(200).json({ data });

});


router.get('/payment', async (req, res) => {
    const userId = req.user.sub;

    const data = await user.getPaymentInfo(userId);
    
    if (!data) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ data });

});

router.put('/payment', async (req, res) => {
  console.log("payment route hit");
  try {
    const userId = req.user.sub;
    if (!userId) return res.status(401).json({ success: false, error: 'Invalid token' });

    const { cardNumber, expiryDate } = req.body;
    if (!cardNumber || !expiryDate) {
      return res.status(400).json({ success: false, error: 'Card number and expiry date required' });
    }

    //Kort sakerna vi sparar inte cvv
    const card = {
      number: cardNumber,
      exp_date: expiryDate,
    };

    const response = await user.savePaymentMethod(userId, card);

    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Failed to save payment method' });
  }
});



router.put('/wallet/add', async (req, res) => {
    const userEmail = req.user.email;
    const userId = req.user.sub;
    const amount = Number(req.body.amount);

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
    }

    try {
        await user.addMoney(userId, amount);

        await invoices.addOne({
            user_id: userId,
            money: amount,
            date: new Date(),
            payment_method: 'fake_card',
            status: 'completed'
        });

        const updatedUser = await user.getOne(userEmail);

        res.status(200).json({ user: toPublicUser(updatedUser) });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Failed to add money' });
    }
});


router.get('/wallet', async (req, res) => {

    const wallet = await getWallet(req.user.sub);

    console.log(wallet)
    res.status(200).json({ success: true, wallet });

});




router.get('/subscription', async (req, res) => {
    console.log(req.user, "route:ska")
    try {
        const subscription = await user.getSubscription(req.user.sub);

        console.log(subscription)
        res.status(200).json({ success: true, subscription });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to fetch subscription info' });
    }
});



router.post('/subscription/start', async (req, res) => {
    const userId = req.user.sub;

    const payment = await user.getPaymentInfo(userId);

    const currentDate = new Date();
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(currentDate.getMonth() + 1);

    const subscriptionData = {
        payment_card: payment.card_id,
        status: 'active',
        monthlyFee: 1000,
        lastBilled: currentDate,
        nextBillingDate: nextBillingDate,
    };

    const logData = {
        user_id: userId,
        card_id: payment.card_id,
        amount: 1000,
        date: currentDate,
        type: "subscribe"
    };

    await subscriptionLog.addOne(logData)

    const updated = await user.updateSubscription(userId, subscriptionData);

    console.log(updated, "updater")
    res.status(200).json({ success: true, subscription: updated });

});



router.put('/subscription/cancel', async (req, res) => {
    const userId = req.user.sub;

    const currentSubscription = await user.getSubscription(userId);

    const payment = await user.getPaymentInfo(userId);

    const currentDate = new Date();

    const subscriptionData = {
        status: 'stopping',
        monthlyFee: 1000,
        lastBilled: currentSubscription.lastBilled,
        nextBillingDate: currentSubscription.nextBillingDate
    };

    const logData = {
        user_id: userId,
        card_id: payment.card_id,
        amount: 1000,
        date: currentDate,
        type: "cancel"
    };

    await subscriptionLog.addOne(logData)

    const updated = await user.updateSubscription(userId, subscriptionData);
    res.status(200).json({ success: true, subscription: updated });


});



// GET /v1/users
router.get('/users', requireAdmin, async (_req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.json([]); // no DB configured

    const users = await db.collection('users').find({}).limit(500).toArray();
    const out = users.map((u) => ({
      id: String(u._id ?? u.id ?? ''),
      email: u.email ?? '',
      role: u.role ?? u.roll ?? 'user',
      balance: Number(u.balance ?? u.wallet ?? 0),
      name: u.name ?? u.username ?? '',
    }));
    return res.json(out);
  } catch {
    // Keep UI working even if DB is temporarily down
    return res.json([]);
  }
});

router.patch('/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const role = req.body?.role === 'admin' ? 'admin' : 'user';

  try {
    const db = await getDb();
    if (!db) return res.status(501).json({ error: 'DB not configured' });

    const _id = ObjectId.isValid(id) ? new ObjectId(id) : null;
    if (!_id) return res.status(400).json({ error: 'Invalid id' });

    await db.collection('users').updateOne({ _id }, { $set: { role } });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const db = await getDb();
    if (!db) return res.status(501).json({ error: 'DB not configured' });

    const _id = ObjectId.isValid(id) ? new ObjectId(id) : null;
    if (!_id) return res.status(400).json({ error: 'Invalid id' });

    await db.collection('users').deleteOne({ _id });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});



// här kommer några fixes till user profil för det gick inte att visa.


router.get('/user/profile', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const users = db.collection('users');

    const userId = req.user?.id ?? req.user?._id ?? null;
    const email = req.user?.email ?? null;

    const u =
      (userId ? await users.findOne({ id: userId }) : null) ||
      (email ? await users.findOne({ email }) : null);

    if (!u) return res.status(404).json({ message: 'User not found' });

    // Never return password fields
    const profile = {
      id: String(u.id ?? u._id ?? ''),
      name: String(u.name ?? u.username ?? ''),
      email: String(u.email ?? ''),
      role: String(u.role ?? u.roll ?? 'user'),
      wallet: Number(u.wallet ?? u.balance ?? 0),
      enabled: Boolean(u.enabled ?? true),
      last4: u.last4 ?? null,
      exp_date: u.exp_date ?? null,
      subscription: u.subscription ?? { status: 'inactive', nextBillingDate: null, monthlyFee: 0 },
      rides: Array.isArray(u.rides) ? u.rides : [],
    };

    return res.json(profile);
  } catch (e) {
    console.error('[user/profile] failed:', e);
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

router.get('/:email', async (req, res) => {
    const email = req.params.email;
    const doc = await user.getOne(email);

    return res.json({ doc });
});

export default router;
