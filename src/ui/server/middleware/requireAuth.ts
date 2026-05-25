import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../../domain/auth/jwt';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const { actorId } = await verifyToken(token);
    res.locals.actorId = actorId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
