import { Router, Request, Response } from 'express';
import { ActorRole } from '../../../domain/shared/ActorRole';
import { ServerWiring } from '../wiring';
import { requireAuth } from '../middleware/requireAuth';

export function createActorsRouter(wiring: ServerWiring): Router {
  const router = Router();

  router.get('/', async (req: Request, res: Response) => {
    const { role } = req.query as { role?: string };
    try {
      const all = await wiring.actorRepo.findAll();
      const actors = role ? all.filter((a) => a.role === role) : all;
      res.json(actors.map((a) => ({ id: a.id, role: a.role, wardUnitId: a.wardUnitId })));
    } catch {
      res.status(500).json({ error: 'Failed to load actors' });
    }
  });

  router.post('/', requireAuth, async (req: Request, res: Response) => {
    const { id, role, wardUnitId, password } = req.body as {
      id: string;
      role: string;
      wardUnitId?: string;
      password: string;
    };
    const result = await wiring.createActorUseCase.execute({
      requestingActorId: res.locals.actorId as string,
      id,
      role: role as ActorRole,
      wardUnitId,
      password,
    });
    if (result.successful) {
      res.status(201).json({ data: result.value });
    } else {
      res.status(422).json({ errors: result.errors.map((e) => e.code) });
    }
  });

  router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
    const { role, wardUnitId } = req.body as { role?: string; wardUnitId?: string | null };
    const result = await wiring.updateActorUseCase.execute({
      requestingActorId: res.locals.actorId as string,
      id: req.params.id as string,
      role: role as ActorRole | undefined,
      wardUnitId,
    });
    if (result.successful) {
      res.json({ data: result.value });
    } else {
      res.status(422).json({ errors: result.errors.map((e) => e.code) });
    }
  });

  router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
    const result = await wiring.deleteActorUseCase.execute({
      requestingActorId: res.locals.actorId as string,
      id: req.params.id as string,
    });
    if (result.successful) {
      res.status(204).send();
    } else {
      res.status(422).json({ errors: result.errors.map((e) => e.code) });
    }
  });

  return router;
}
