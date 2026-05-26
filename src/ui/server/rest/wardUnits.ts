import { Router, Request, Response } from 'express';
import { ServerWiring } from '../wiring';
import { requireAuth } from '../middleware/requireAuth';

export function createWardUnitsRouter(wiring: ServerWiring): Router {
  const router = Router();

  router.post('/', requireAuth, async (req: Request, res: Response) => {
    const { id, name } = req.body as { id: string; name: string };
    const result = await wiring.createWardUnitUseCase.execute({
      requestingActorId: res.locals.actorId as string,
      id,
      name,
    });
    if (result.successful) {
      res.status(201).json({ data: result.value });
    } else {
      res.status(422).json({ errors: result.errors.map((e) => e.code) });
    }
  });

  router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
    const { name } = req.body as { name: string };
    const result = await wiring.updateWardUnitUseCase.execute({
      requestingActorId: res.locals.actorId as string,
      id: req.params.id as string,
      name,
    });
    if (result.successful) {
      res.json({ data: result.value });
    } else {
      res.status(422).json({ errors: result.errors.map((e) => e.code) });
    }
  });

  router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
    const result = await wiring.deleteWardUnitUseCase.execute({
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
