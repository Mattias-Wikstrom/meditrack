import { Router, Request, Response } from 'express';
import { ServerWiring } from '../wiring';
import { MedicationId, MedicinalProductId, OrderId } from '../../../domain/shared/IdTypes';

export function createOrdersRouter(wiring: ServerWiring): Router {
  const router = Router();

  router.post('/', async (req: Request, res: Response) => {
    const { lines } = req.body as {
      lines: { medicationId: string; quantity: number }[];
    };
    const result = await wiring.createOrderUseCase.execute({
      actorId: res.locals.actorId as string,
      lines: lines.map((l) => ({ medicationId: l.medicationId as MedicationId, quantity: l.quantity })),
    });
    if (result.successful) {
      res.status(201).json({ data: result.value });
    } else {
      res.status(422).json({ errors: result.errors.map((e) => e.code) });
    }
  });

  router.post('/:id/lines', async (req: Request, res: Response) => {
    const { lines } = req.body as {
      lines: { medicationId: string; quantity: number }[];
    };
    const result = await wiring.updateOrderLinesUseCase.execute({
      actorId: res.locals.actorId as string,
      orderId: req.params.id as OrderId,
      lines: lines.map((l) => ({ medicationId: l.medicationId as MedicationId, quantity: l.quantity })),
    });
    if (result.successful) {
      res.json({ data: result.value });
    } else {
      res.status(422).json({ errors: result.errors.map((e) => e.code) });
    }
  });

  router.post('/:id/send', async (req: Request, res: Response) => {
    const result = await wiring.sendOrderUseCase.execute({
      actorId: res.locals.actorId as string,
      orderId: req.params.id as OrderId,
    });
    if (result.successful) {
      res.json({ data: result.value });
    } else {
      res.status(422).json({ errors: result.errors.map((e) => e.code) });
    }
  });

  router.post('/:id/confirm', async (req: Request, res: Response) => {
    const result = await wiring.confirmOrderUseCase.execute({
      actorId: res.locals.actorId as string,
      orderId: req.params.id as OrderId,
    });
    if (result.successful) {
      res.json({ data: result.value });
    } else {
      res.status(422).json({ errors: result.errors.map((e) => e.code) });
    }
  });

  router.post('/:id/deliver', async (req: Request, res: Response) => {
    const { productSelections } = req.body as {
      productSelections: { medicationId: string; medicinalProductId: string; quantity: number }[];
    };
    const result = await wiring.deliverOrderUseCase.execute({
      actorId: res.locals.actorId as string,
      orderId: req.params.id as OrderId,
      productSelections: productSelections.map((s) => ({
        medicationId: s.medicationId as MedicationId,
        medicinalProductId: s.medicinalProductId as MedicinalProductId,
        quantity: s.quantity,
      })),
    });
    if (result.successful) {
      res.json({ data: result.value });
    } else {
      res.status(422).json({ errors: result.errors.map((e) => e.code) });
    }
  });

  return router;
}
