import jwt from 'jsonwebtoken';

export function signToken(user) {
    const secret = process.env.JWT_SECRET || "dev-secret";

    const userId = user.id ?? user._id ?? null; // first try id, fallback to _id
    if (!userId) throw new Error("User ID missing for JWT");

    return jwt.sign(
        {
        sub: String(userId),
        email: user.email,
        role: user.role,
        name: user.name,
        wallet: user.wallet,
        last4: user.last4,
        enabled: user.enabled,
        exp_date: user.exp_date,
        subscription: user.subscription
        },
        secret,
        { expiresIn: "7d" }
    );
};
