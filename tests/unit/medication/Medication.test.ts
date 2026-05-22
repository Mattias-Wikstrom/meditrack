import { describe, it, expect } from 'vitest';
import { Medication } from '../../../src/domain/medication/Medication';
import { MedicationForm } from '../../../src/domain/medication/MedicationForm';

const paracetamol = (stockLevel: number, stockThreshold: number) =>
  new Medication('med-1', 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg', stockLevel, stockThreshold);

describe('Medication.isBelowThreshold', () => {
  it('is true when stock is below threshold', () => {
    expect(paracetamol(5, 10).isBelowThreshold).toBe(true);
  });

  it('is false when stock equals threshold', () => {
    expect(paracetamol(10, 10).isBelowThreshold).toBe(false);
  });

  it('is false when stock is above threshold', () => {
    expect(paracetamol(15, 10).isBelowThreshold).toBe(false);
  });
});
