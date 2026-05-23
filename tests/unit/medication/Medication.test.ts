import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { Medication } from '../../../src/domain/medication/Medication';
import { MedicationForm } from '../../../src/domain/medication/MedicationForm';
import { MedicationId } from '../../../src/domain/shared/Id';

const paracetamol = (stockLevel: Decimal, stockThreshold: Decimal) =>
  new Medication('med-1' as MedicationId, 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg', stockLevel, stockThreshold);

describe('Medication.isBelowThreshold', () => {
  it('is true when stock is below threshold', () => {
    expect(paracetamol(new Decimal(5), new Decimal(10)).isBelowThreshold).toBe(true);
  });

  it('is false when stock equals threshold', () => {
    expect(paracetamol(new Decimal(10), new Decimal(10)).isBelowThreshold).toBe(false);
  });

  it('is false when stock is above threshold', () => {
    expect(paracetamol(new Decimal(15), new Decimal(10)).isBelowThreshold).toBe(false);
  });
});
