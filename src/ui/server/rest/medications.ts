import { Router, Request, Response } from 'express';
import { ServerWiring } from '../wiring';
import { requireAuth } from '../middleware/requireAuth';
import { MedicationForm } from '../../../domain/medication/MedicationForm';
import { MedicationId } from '../../../domain/shared/IdTypes';

export function createMedicationsRouter(wiring: ServerWiring): Router {
  const router = Router();

  router.post('/', requireAuth, async (req: Request, res: Response) => {
    const { innName, atcCode, form, strength } = req.body as {
      innName: string;
      atcCode: string;
      form: string;
      strength: string;
    };
    const result = await wiring.createMedicationUseCase.execute({
      requestingActorId: res.locals.actorId as string,
      innName,
      atcCode,
      form: form as MedicationForm,
      strength,
    });
    if (result.successful) {
      res.status(201).json({ data: result.value });
    } else {
      res.status(422).json({ errors: result.errors.map((e) => e.code) });
    }
  });

  router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
    const { innName, atcCode, form, strength } = req.body as {
      innName?: string;
      atcCode?: string;
      form?: string;
      strength?: string;
    };
    const result = await wiring.updateMedicationUseCase.execute({
      requestingActorId: res.locals.actorId as string,
      id: req.params.id as MedicationId,
      innName,
      atcCode,
      form: form as MedicationForm | undefined,
      strength,
    });
    if (result.successful) {
      res.json({ data: result.value });
    } else {
      const status = result.errors.some((e) => e.code === 'MedicationNotFound') ? 404 : 422;
      res.status(status).json({ errors: result.errors.map((e) => e.code) });
    }
  });

  router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
    const result = await wiring.deleteMedicationUseCase.execute({
      requestingActorId: res.locals.actorId as string,
      id: req.params.id as MedicationId,
    });
    if (result.successful) {
      res.status(204).send();
    } else {
      const status = result.errors.some((e) => e.code === 'MedicationNotFound') ? 404 : 422;
      res.status(status).json({ errors: result.errors.map((e) => e.code) });
    }
  });

  router.post('/:medicationId/products', requireAuth, async (req: Request, res: Response) => {
    const { productName, stockLevel, stockThreshold } = req.body as {
      productName: string;
      stockLevel: number;
      stockThreshold: number;
    };
    const result = await wiring.createMedicinalProductUseCase.execute({
      requestingActorId: res.locals.actorId as string,
      medicationId: req.params.medicationId as MedicationId,
      productName,
      stockLevel,
      stockThreshold,
    });
    if (result.successful) {
      res.status(201).json({ data: result.value });
    } else {
      const status = result.errors.some((e) => e.code === 'MedicationNotFound') ? 404 : 422;
      res.status(status).json({ errors: result.errors.map((e) => e.code) });
    }
  });

  return router;
}
