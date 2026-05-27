import { Router, Request, Response } from 'express';
import { ServerWiring } from '../wiring';
import { requireAuth } from '../middleware/requireAuth';
import { MedicinalProductId } from '../../../domain/shared/IdTypes';

export function createProductsRouter(wiring: ServerWiring): Router {
  const router = Router();

  router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
    const { productName, stockThreshold } = req.body as {
      productName?: string;
      stockThreshold?: number;
    };
    const result = await wiring.updateMedicinalProductUseCase.execute({
      requestingActorId: res.locals.actorId as string,
      id: req.params.id as MedicinalProductId,
      productName,
      stockThreshold,
    });
    if (result.successful) {
      res.json({ data: result.value });
    } else {
      const status = result.errors.some((e) => e.code === 'MedicinalProductNotFound') ? 404 : 422;
      res.status(status).json({ errors: result.errors.map((e) => e.code) });
    }
  });

  router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
    const result = await wiring.deleteMedicinalProductUseCase.execute({
      requestingActorId: res.locals.actorId as string,
      id: req.params.id as MedicinalProductId,
    });
    if (result.successful) {
      res.status(204).send();
    } else {
      const status = result.errors.some((e) => e.code === 'MedicinalProductNotFound') ? 404 : 422;
      res.status(status).json({ errors: result.errors.map((e) => e.code) });
    }
  });

  return router;
}
