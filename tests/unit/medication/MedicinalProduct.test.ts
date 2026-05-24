import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { MedicinalProduct } from '../../../src/domain/medication/MedicinalProduct';
import { MedicationId, MedicinalProductId } from '../../../src/domain/shared/IdTypes';

const createAndReturnProduct = (arg: {stockLevel: Decimal, stockThreshold: Decimal}) =>
  new MedicinalProduct('prod-1' as MedicinalProductId, 'Paracetamol 500mg', 'med-1' as MedicationId, arg.stockLevel, arg.stockThreshold);

describe('MedicinalProduct.isBelowThreshold', () => {
  it('is true when stock is below threshold', () => {
    expect(createAndReturnProduct({stockLevel: new Decimal(5), stockThreshold: new Decimal(10)}).isBelowThreshold).toBe(true);
  });

  it('is false when stock equals threshold', () => {
    expect(createAndReturnProduct({stockLevel: new Decimal(10), stockThreshold: new Decimal(10)}).isBelowThreshold).toBe(false);
  });

  it('is false when stock is above threshold', () => {
    expect(createAndReturnProduct({stockLevel: new Decimal(15), stockThreshold: new Decimal(10)}).isBelowThreshold).toBe(false);
  });
});
