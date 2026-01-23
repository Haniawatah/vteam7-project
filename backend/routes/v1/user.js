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



router.get('/profile', async (req, res) => {
    const db = getDb();

    if (!db) {
        return res.status(500).json({ message: 'Database not configured' });
    }

    try {
        const data = await db.collection('users').findOne({
            email: req.user.email
        });

        if (!data) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ data });
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});





router.get('/payment', async (req, res) => {
    const userId = req.user._id;

    const data = await user.getPaymentInfo(userId);
    
    if (!data) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ data });

});

router.put('/payment', async (req, res) => {
  try {
    const userId = req.user._id;
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
    const userId = req.user._id;
    const amount = Number(req.body.amount);

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
    }

    try {
        await user.addMoney(userId, amount);

        await invoices.addOne({
            user_id: userId,
            email: userEmail,
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

    const wallet = await getWallet(req.user._id);

    res.status(200).json({ success: true, wallet });

});




router.get('/subscription', async (req, res) => {
    try {
        const subscription = await user.getSubscription(req.user._id);
        res.status(200).json({ success: true, subscription });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Failed to fetch subscription info' });
    }
});



router.post('/subscription/start', async (req, res) => {
    const userId = req.user._id;
    const email = req.user.email;

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
        email: email,
        amount: 1000,
        date: currentDate,
        type: "subscribe"
    };

    await subscriptionLog.addOne(logData)

    const updated = await user.updateSubscription(userId, subscriptionData);

    res.status(200).json({ success: true, subscription: updated });

});



router.put('/subscription/cancel', async (req, res) => {
    const userId = req.user._id;
    const email = req.user.email;

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
        email: email,
        amount: 1000,
        date: currentDate,
        type: "cancel"
    };

    await subscriptionLog.addOne(logData)

    const updated = await user.updateSubscription(userId, subscriptionData);
    res.status(200).json({ success: true, subscription: updated });
});


//Aktiver sub igen
router.post('/subscription/reactivate', async (req, res) => {
    const userId = req.user._id;
    const email = req.user.email;

    const currentSubscription = await user.getSubscription(userId);

    const payment = await user.getPaymentInfo(userId);

    const currentDate = new Date();

    const subscriptionData = {
        status: 'active',
        monthlyFee: 1000,
        lastBilled: currentSubscription.lastBilled,
        nextBillingDate: currentSubscription.nextBillingDate
    };

    const logData = {
        user_id: userId,
        card_id: payment.card_id,
        email: email,
        amount: 1000,
        date: currentDate,
        type: "Reactivated"
    };

    await subscriptionLog.addOne(logData)

    const updated = await user.updateSubscription(userId, subscriptionData);
    res.status(200).json({ success: true, subscription: updated });


});



// GET /v1/users


//Ändra roll på konto
router.patch('/role/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const role = req.body?.role === 'admin' ? 'admin' : 'user';

  try {
    const db = await getDb();
    if (!db) return res.status(501).json({ message: 'DB not configured' });

    const _id = ObjectId.isValid(id) ? new ObjectId(id) : null;
    if (!_id) return res.status(400).json({ message: 'Invalid id' });

    await db.collection('users').updateOne({ _id }, { $set: { role } });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ message: 'Failed to update user' });
  }
});

router.delete('/delete/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const db = await getDb();
    if (!db) return res.status(501).json({ message: 'DB not configured' });

    const _id = ObjectId.isValid(id) ? new ObjectId(id) : null;
    if (!_id) return res.status(400).json({ message: 'Invalid id' });

    await db.collection('users').deleteOne({ _id });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ message: 'Failed to delete user' });
  }
});





export default router;
