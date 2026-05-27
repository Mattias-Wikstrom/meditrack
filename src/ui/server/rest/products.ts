import { Router, Request, Response } from 'express';
import { ServerWiring } from '../wiring';
import { requireAuth } from '../middleware/requireAuth';
import { MedicinalProduct } from '../../../domain/medication/MedicinalProduct';
import { MedicinalProductId } from '../../../domain/shared/IdTypes';

export function createProductsRouter(wiring: ServerWiring): Router {
  const router = Router();

  router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
    const existing = await wiring.medicinalProductRepo.findById(req.params.id as MedicinalProductId);
    if (!existing) {
      res.status(404).json({ errors: ['Product not found.'] });
      return;
    }
    const { productName, stockThreshold } = req.body as {
      productName?: string;
      stockThreshold?: number;
    };
    const updated = new MedicinalProduct(
      existing.id,
      productName ?? existing.productName,
      existing.medicationId,
      existing.stockLevel,
      stockThreshold ?? existing.stockThreshold,
    );
    await wiring.medicinalProductRepo.save(updated);
    res.json({ data: updated });
  });

  router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
    await wiring.medicinalProductRepo.delete(req.params.id as MedicinalProductId);
    res.status(204).send();
  });

  return router;
}
