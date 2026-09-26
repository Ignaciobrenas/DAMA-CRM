import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  isTemp2FA?: boolean;
}

export function generateToken(payload: TokenPayload, expiresIn: string | number = config.jwt.expiresIn): string {
  return jwt.sign(payload, config.jwt.secret, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
}
