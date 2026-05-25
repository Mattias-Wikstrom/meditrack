import { Router, Request, Response } from 'express';
import { prisma } from '../../../storage/prisma/prismaClient';
import { PrismaCredentialsRepository } from '../../../storage/prisma/PrismaCredentialsRepository';
import { PrismaAuditRepository } from '../../../storage/prisma/PrismaAuditRepository';
import { LoginUseCase } from '../../../domain/auth/LoginUseCase';
import { ChangePasswordUseCase } from '../../../domain/auth/ChangePasswordUseCase';
import { requireAuth } from '../middleware/requireAuth';

const credRepo = new PrismaCredentialsRepository(prisma);
const auditRepo = new PrismaAuditRepository(prisma);
const loginUseCase = new LoginUseCase(credRepo, auditRepo);
const changePasswordUseCase = new ChangePasswordUseCase(credRepo, auditRepo);

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

  router.post('/change-password', requireAuth, async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body as { oldPassword?: string; newPassword?: string };
    if (!oldPassword || !newPassword) {
      res.status(400).json({ error: 'oldPassword and newPassword are required' });
      return;
    }
    try {
      await changePasswordUseCase.execute(res.locals.actorId as string, oldPassword, newPassword);
      res.json({ ok: true });
    } catch (e) {
      if (e instanceof Error && e.message === 'InvalidCredentials') {
        res.status(401).json({ error: 'Invalid credentials' });
      } else {
        res.status(500).json({ error: 'Failed to change password' });
      }
    }
  });

  return router;
}
