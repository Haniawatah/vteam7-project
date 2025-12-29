import 'dotenv/config';
import express from 'express';
import jwt from 'jsonwebtoken';
import user from "../../models/user.js";
import { checkToken } from '../../middleware/utils.js';

const router = express.Router();

router.post("/reg", async (req, res) => {
    const result = await user.register(req.body);
    res.status(201).json({ result });
});


router.post("/register", async (req, res) => {

    const result = await user.register(req.body);

    const account = await user.getOne(req.body.email);
    const payload = { email: account.email, name: account.name, role: account.roll };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).json({ success: true, token });
});



router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    console.log(email, password)

    console.log("--------------------------")

    const test = await user.getAll();

    console.log(test)

    const account = await user.getOne(email);

    console.log("--------------------------")

    console.log(account)

    if (!account || account.password !== password) {
        return res.status(401).json({ success: false, message: "Wrong email or password" });
    }

    const payload = { email: account.email, name: account.name, role: account.roll, user_id: account._id };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).json({ success: true, token });

});


export default router;
