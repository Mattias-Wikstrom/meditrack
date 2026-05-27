import { randomUUID } from 'crypto';
import { Router, Request, Response } from 'express';
import { ServerWiring } from '../wiring';
import { requireAuth } from '../middleware/requireAuth';
import { Medication } from '../../../domain/medication/Medication';
import { MedicinalProduct } from '../../../domain/medication/MedicinalProduct';
import { MedicationForm } from '../../../domain/medication/MedicationForm';
import { MedicationId, MedicinalProductId } from '../../../domain/shared/IdTypes';

export function createMedicationsRouter(wiring: ServerWiring): Router {
  const router = Router();

  router.post('/', requireAuth, async (req: Request, res: Response) => {
    const { innName, atcCode, form, strength } = req.body as {
      innName: string;
      atcCode: string;
      form: string;
      strength: string;
    };
    const medication = new Medication(
      randomUUID() as MedicationId,
      innName,
      atcCode,
      form as MedicationForm,
      strength,
    );
    await wiring.medicationRepo.save(medication);
    res.status(201).json({ data: medication });
  });

  router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
    const existing = await wiring.medicationRepo.findById(req.params.id as MedicationId);
    if (!existing) {
      res.status(404).json({ errors: ['Medication not found.'] });
      return;
    }
    const { innName, atcCode, form, strength } = req.body as {
      innName?: string;
      atcCode?: string;
      form?: string;
      strength?: string;
    };
    const updated = new Medication(
      existing.id,
      innName ?? existing.innName,
      atcCode ?? existing.atcCode,
      (form ?? existing.form) as MedicationForm,
      strength ?? existing.strength,
    );
    await wiring.medicationRepo.save(updated);
    res.json({ data: updated });
  });

  router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
    const products = await wiring.medicinalProductRepo.findByMedicationId(req.params.id as MedicationId);
    if (products.length > 0) {
      res.status(422).json({ errors: ['Cannot delete a medication that has products — remove its products first.'] });
      return;
    }
    await wiring.medicationRepo.delete(req.params.id as MedicationId);
    res.status(204).send();
  });

  router.post('/:medicationId/products', requireAuth, async (req: Request, res: Response) => {
    const { productName, stockLevel, stockThreshold } = req.body as {
      productName: string;
      stockLevel: number;
      stockThreshold: number;
    };
    const product = new MedicinalProduct(
      randomUUID() as MedicinalProductId,
      productName,
      req.params.medicationId as MedicationId,
      stockLevel,
      stockThreshold,
    );
    await wiring.medicinalProductRepo.save(product);
    res.status(201).json({ data: product });
  });

  return router;
}
