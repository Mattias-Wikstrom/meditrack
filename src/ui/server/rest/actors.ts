import { Router, Request, Response } from 'express';
import { prisma } from '../../../storage/prisma/prismaClient';
import { PrismaActorRepository } from '../../../storage/prisma/PrismaActorRepository';

const actorRepo = new PrismaActorRepository(prisma);

export function createActorsRouter(): Router {
  const router = Router();

  router.get('/', async (req: Request, res: Response) => {
    const { role } = req.query as { role?: string };
    try {
      const all = await actorRepo.findAll();
      const actors = role ? all.filter((a) => a.role === role) : all;
      res.json(actors.map((a) => ({ id: a.id, role: a.role })));
    } catch {
      res.status(500).json({ error: 'Failed to load actors' });
    }
  });

  return router;
}
