import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { MedicinalProduct } from '../../../src/domain/medication/MedicinalProduct';
import { MedicationId, MedicinalProductId } from '../../../src/domain/shared/Id';

const product = (stockLevel: Decimal, stockThreshold: Decimal) =>
  new MedicinalProduct('prod-1' as MedicinalProductId, 'Paracetamol 500mg', 'med-1' as MedicationId, stockLevel, stockThreshold);

describe('MedicinalProduct.isBelowThreshold', () => {
  it('is true when stock is below threshold', () => {
    expect(product(new Decimal(5), new Decimal(10)).isBelowThreshold).toBe(true);
  });

  it('is false when stock equals threshold', () => {
    expect(product(new Decimal(10), new Decimal(10)).isBelowThreshold).toBe(false);
  });

  it('is false when stock is above threshold', () => {
    expect(product(new Decimal(15), new Decimal(10)).isBelowThreshold).toBe(false);
  });
});
