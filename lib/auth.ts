import jwt, { Secret } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export function generateToken(userId: string, email: string, isAdmin: boolean): string {
  const secret = process.env.JWT_SECRET as Secret;
  const expiresIn = parseInt(process.env.JWT_EXPIRES_IN || '86400');
  
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    { sub: userId, email, isAdmin },
    secret,
    { expiresIn }
  );
}

export function verifyToken(token: string): { sub: string; email: string; isAdmin: boolean } | null {
  const secret = process.env.JWT_SECRET as Secret;
  
  if (!secret) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret) as { sub: string; email: string; isAdmin: boolean };
    return decoded;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
