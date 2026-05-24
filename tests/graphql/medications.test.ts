import { describe, it, expect } from 'vitest';
import { graphql } from 'graphql';
import { schema } from '../../src/api/graphql/schema';
import { createTestContext } from '../helpers/createTestContext';
import Decimal from 'decimal.js';
import { Medication } from '../../src/domain/medication/Medication';
import { MedicinalProduct } from '../../src/domain/medication/MedicinalProduct';
import { MedicationForm } from '../../src/domain/medication/MedicationForm';
import { MedicationId, MedicinalProductId } from '../../src/domain/shared/IdTypes';

describe('Query.medications', () => {
  it('returns an empty list when there are no medications', async () => {
    const result = await graphql({ schema, source: '{ medications { id } }', contextValue: createTestContext() });

    expect(result.errors).toBeUndefined();
    expect(result.data?.medications).toEqual([]);
  });

  it('returns all medications when no search query is given', async () => {
    const ctx = createTestContext();
    await ctx.medicationRepo.save(new Medication('med-1' as MedicationId, 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg'));
    await ctx.medicationRepo.save(new Medication('med-2' as MedicationId, 'Ibuprofen', 'M01AE01', MedicationForm.Tablet, '400mg'));

    const result = await graphql({ schema, source: '{ medications { id innName } }', contextValue: ctx });

    expect(result.errors).toBeUndefined();
    expect(result.data?.medications).toHaveLength(2);
  });

  it('filters medications by INN name when a search query is given', async () => {
    const ctx = createTestContext();
    await ctx.medicationRepo.save(new Medication('med-1' as MedicationId, 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg'));
    await ctx.medicationRepo.save(new Medication('med-2' as MedicationId, 'Ibuprofen', 'M01AE01', MedicationForm.Tablet, '400mg'));

    const result = await graphql({
      schema,
      source: '{ medications(query: "para") { innName } }',
      contextValue: ctx,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.medications).toEqual([{ innName: 'Paracetamol' }]);
  });
});

describe('Query.medication', () => {
  it('returns null for an unknown id', async () => {
    const result = await graphql({
      schema,
      source: '{ medication(id: "nope") { id } }',
      contextValue: createTestContext(),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.medication).toBeNull();
  });

  it('returns the medication for a known id', async () => {
    const ctx = createTestContext();
    await ctx.medicationRepo.save(new Medication('med-1' as MedicationId, 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg'));

    const result = await graphql({
      schema,
      source: '{ medication(id: "med-1") { innName atcCode form strength } }',
      contextValue: ctx,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.medication).toMatchObject({
      innName: 'Paracetamol',
      atcCode: 'N02BE01',
      form: 'Tablet',
      strength: '500mg',
    });
  });
});

describe('Query.medicinalProducts', () => {
  it('returns an empty list when there are no medicinal products', async () => {
    const result = await graphql({ schema, source: '{ medicinalProducts { id } }', contextValue: createTestContext() });

    expect(result.errors).toBeUndefined();
    expect(result.data?.medicinalProducts).toEqual([]);
  });

  it('returns isBelowThreshold correctly', async () => {
    const ctx = createTestContext();
    await ctx.medicationRepo.save(new Medication('med-1' as MedicationId, 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg'));
    await ctx.medicinalProductRepo.save(
      new MedicinalProduct('prod-1' as MedicinalProductId, 'Alvedon 500mg', 'med-1' as MedicationId, new Decimal(5), new Decimal(20)),
    );

    const result = await graphql({
      schema,
      source: '{ medicinalProducts { isBelowThreshold } }',
      contextValue: ctx,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.medicinalProducts[0].isBelowThreshold).toBe(true);
  });

  it('resolves the nested medication', async () => {
    const ctx = createTestContext();
    await ctx.medicationRepo.save(new Medication('med-1' as MedicationId, 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg'));
    await ctx.medicinalProductRepo.save(
      new MedicinalProduct('prod-1' as MedicinalProductId, 'Alvedon 500mg', 'med-1' as MedicationId, new Decimal(10), new Decimal(5)),
    );

    const result = await graphql({
      schema,
      source: '{ medicinalProducts { productName medication { innName } } }',
      contextValue: ctx,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.medicinalProducts[0].productName).toBe('Alvedon 500mg');
    expect(result.data?.medicinalProducts[0].medication.innName).toBe('Paracetamol');
  });
});
