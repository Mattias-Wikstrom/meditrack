import { describe, it, expect } from 'vitest';
import { MedicinalProduct } from '../../../src/domain/medication/MedicinalProduct';
import { MedicationId, MedicinalProductId } from '../../../src/domain/shared/IdTypes';

const createAndReturnProduct = (arg: { stockLevel: number; stockThreshold: number }) =>
  new MedicinalProduct('prod-1' as MedicinalProductId, 'Paracetamol 500mg', 'med-1' as MedicationId, arg.stockLevel, arg.stockThreshold);

describe('MedicinalProduct.isBelowThreshold', () => {
  it('is true when stock is below threshold', () => {
    expect(createAndReturnProduct({ stockLevel: 5, stockThreshold: 10 }).isBelowThreshold).toBe(true);
  });

  it('is false when stock equals threshold', () => {
    expect(createAndReturnProduct({ stockLevel: 10, stockThreshold: 10 }).isBelowThreshold).toBe(false);
  });

  it('is false when stock is above threshold', () => {
    expect(createAndReturnProduct({ stockLevel: 15, stockThreshold: 10 }).isBelowThreshold).toBe(false);
  });
});
