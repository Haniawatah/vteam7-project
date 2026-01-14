import jwt from 'jsonwebtoken';
import { getJwtSecret } from './utils.js';

export function signToken(user) {
  const secret = getJwtSecret();
  if (!secret) throw new Error('JWT secret is not configured');

  const payload = {
    id: user?.id ?? user?._id,
    email: user?.email,
    role: user?.role ?? user?.roll ?? 'user',
  };

  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export default signToken;
