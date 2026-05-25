import { MedicationId } from '../shared/IdTypes';

export class OrderLine {
  constructor(
    public readonly medicationId: MedicationId,
    public readonly quantity: number,
  ) {}
}
