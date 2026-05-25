import { Router, Request, Response } from 'express';
import { prisma } from '../../../storage/prisma/prismaClient';
import { PrismaCredentialsRepository } from '../../../storage/prisma/PrismaCredentialsRepository';
import { PrismaAuditRepository } from '../../../storage/prisma/PrismaAuditRepository';
import { LoginUseCase } from '../../../domain/auth/LoginUseCase';

const loginUseCase = new LoginUseCase(
  new PrismaCredentialsRepository(prisma),
  new PrismaAuditRepository(prisma),
);

export function createAuthRouter(): Router {
  const router = Router();

  router.post('/login', async (req: Request, res: Response) => {
    const { actorId, password } = req.body as { actorId?: string; password?: string };
    if (!actorId || !password) {
      res.status(400).json({ error: 'actorId and password are required' });
      return;
    }
    try {
      const token = await loginUseCase.execute(actorId, password);
      res.json({ token });
    } catch {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  return router;
}
