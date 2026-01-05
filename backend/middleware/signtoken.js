import jwt from 'jsonwebtoken';

// Skapar en JWT-token som frontend sparar i localStorage.
// Payload innehåller id/email/role så UI kan veta om användaren är admin.
export function signToken(user) {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
  const expiresIn = process.env.TOKEN_EXPIRES_IN || '7d';

  return jwt.sign(
    { sub: user.id, id: user.id, email: user.email, role: user.role, name: user.name },
    secret,
    { expiresIn }
  );
}
