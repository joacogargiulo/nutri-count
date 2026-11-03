import { createHmac, timingSafeEqual } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';

// Token firmado tipo JWT simplificado: base64url(payload).base64url(HMAC-SHA256).
// El secreto sale de AUTH_SECRET; si no esta definido se deriva de SUPABASE_KEY (ya requerida).
const SECRET = process.env.AUTH_SECRET || `nutricount:${process.env.SUPABASE_KEY || ''}`;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuthPayload {
  id: number;
  rol: UserRole;
  exp: number;
}

const sign = (data: string) => createHmac('sha256', SECRET).update(data).digest('base64url');

export function createToken(id: number, rol: UserRole): string {
  const body = Buffer.from(JSON.stringify({ id, rol, exp: Date.now() + TTL_MS })).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function verifyToken(token: string): AuthPayload | null {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = Buffer.from(sign(body));
  const received = Buffer.from(sig);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const payload: AuthPayload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthPayload;
  }
}

// Exige "Authorization: Bearer <token>" valido y deja el usuario autenticado en req.auth
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const payload = header.startsWith('Bearer ') ? verifyToken(header.slice(7)) : null;
  if (!payload) {
    return res.status(401).json({ error: 'Sesión inválida o vencida. Iniciá sesión nuevamente.' });
  }
  req.auth = payload;
  next();
}
