import { describe, it, expect } from 'vitest';
import { graphql } from 'graphql';
import { schema } from '../../src/api/graphql/schema';
import { createTestContext } from '../helpers/createTestContext';
import { Medication } from '../../src/domain/medication/Medication';
import { MedicinalProduct } from '../../src/domain/medication/MedicinalProduct';
import { MedicationForm } from '../../src/domain/medication/MedicationForm';
import { MedicationId, MedicinalProductId, WardUnitId } from '../../src/domain/shared/IdTypes';
import { WardUnit } from '../../src/domain/wardUnit/WardUnit';

const CREATE_ORDER = /* GraphQL */ `
  mutation CreateOrder($wardUnitId: ID!, $lines: [OrderLineInput!]!) {
    createOrder(wardUnitId: $wardUnitId, lines: $lines) {
      successful
      errors
      order { id status lines { medicationId quantity } }
    }
  }
`;

const SEND_ORDER = /* GraphQL */ `
  mutation SendOrder($orderId: ID!) {
    sendOrder(orderId: $orderId) {
      successful
      errors
      order { status }
    }
  }
`;

const CONFIRM_ORDER = /* GraphQL */ `
  mutation ConfirmOrder($orderId: ID!) {
    confirmOrder(orderId: $orderId) {
      successful
      errors
      order { status }
    }
  }
`;

const DELIVER_ORDER = /* GraphQL */ `
  mutation DeliverOrder($orderId: ID!, $productSelections: [ProductSelectionInput!]!) {
    deliverOrder(orderId: $orderId, productSelections: $productSelections) {
      successful
      errors
      order { status }
    }
  }
`;

describe('Mutation.createOrder', () => {
  it('returns a draft order on success', async () => {
    const ctx = createTestContext('nurse-1');

    const result = await graphql({
      schema,
      source: CREATE_ORDER,
      contextValue: ctx,
      variableValues: { wardUnitId: 'ward-1', lines: [{ medicationId: 'med-1', quantity: 5 }] },
    });

    expect(result.errors).toBeUndefined();
    expect((result.data as any)?.createOrder.successful).toBe(true);
    expect((result.data as any)?.createOrder.order.status).toBe('Draft');
    expect((result.data as any)?.createOrder.errors).toEqual([]);
  });

  it('returns errors and no order when validation fails', async () => {
    const ctx = createTestContext('nurse-1');

    const result = await graphql({
      schema,
      source: CREATE_ORDER,
      contextValue: ctx,
      variableValues: { wardUnitId: 'ward-1', lines: [] },
    });

    expect(result.errors).toBeUndefined();
    expect((result.data as any)?.createOrder.successful).toBe(false);
    expect((result.data as any)?.createOrder.errors).toContain('OrderHasAtLeastOneLine');
    expect((result.data as any)?.createOrder.order).toBeNull();
  });
});

describe('Mutation.sendOrder', () => {
  it('advances a draft order to sent', async () => {
    const ctx = createTestContext('nurse-1');
    const created = await graphql({
      schema, source: CREATE_ORDER, contextValue: ctx,
      variableValues: { wardUnitId: 'ward-1', lines: [{ medicationId: 'med-1', quantity: 5 }] },
    });
    const orderId = (created.data as any)?.createOrder.order.id;

    const result = await graphql({ schema, source: SEND_ORDER, contextValue: ctx, variableValues: { orderId } });

    expect(result.errors).toBeUndefined();
    expect((result.data as any)?.sendOrder.successful).toBe(true);
    expect((result.data as any)?.sendOrder.order.status).toBe('Sent');
  });

  it('returns an error for an unknown order', async () => {
    const result = await graphql({
      schema, source: SEND_ORDER, contextValue: createTestContext('nurse-1'),
      variableValues: { orderId: 'no-such-order' },
    });

    expect((result.data as any)?.sendOrder.successful).toBe(false);
    expect((result.data as any)?.sendOrder.errors).toContain('OrderNotFound');
  });
});

describe('Mutation.confirmOrder', () => {
  it('advances a sent order to confirmed', async () => {
    const ctx = createTestContext('nurse-1');
    const pharmacistCtx = { ...ctx, actorId: 'pharmacist-1' };
    const created = await graphql({
      schema, source: CREATE_ORDER, contextValue: ctx,
      variableValues: { wardUnitId: 'ward-1', lines: [{ medicationId: 'med-1', quantity: 5 }] },
    });
    const orderId = (created.data as any)?.createOrder.order.id;
    await graphql({ schema, source: SEND_ORDER, contextValue: ctx, variableValues: { orderId } });

    const result = await graphql({ schema, source: CONFIRM_ORDER, contextValue: pharmacistCtx, variableValues: { orderId } });

    expect(result.errors).toBeUndefined();
    expect((result.data as any)?.confirmOrder.successful).toBe(true);
    expect((result.data as any)?.confirmOrder.order.status).toBe('Confirmed');
  });

  it('returns an error for an unknown order', async () => {
    const ctx = createTestContext('nurse-1');
    const pharmacistCtx = { ...ctx, actorId: 'pharmacist-1' };

    const result = await graphql({
      schema, source: CONFIRM_ORDER, contextValue: pharmacistCtx,
      variableValues: { orderId: 'no-such-order' },
    });

    expect((result.data as any)?.confirmOrder.successful).toBe(false);
    expect((result.data as any)?.confirmOrder.errors).toContain('OrderNotFound');
  });
});

describe('Mutation.deliverOrder', () => {
  it('updates stock and marks order as delivered', async () => {
    const ctx = createTestContext('nurse-1');
    const pharmacistCtx = { ...ctx, actorId: 'pharmacist-1' };
    await ctx.medicationRepo.save(
      new Medication('med-1' as MedicationId, 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg'),
    );
    await ctx.medicinalProductRepo.save(
      new MedicinalProduct('prod-1' as MedicinalProductId, 'Paracetamol 500mg', 'med-1' as MedicationId, 50, 5),
    );

    const created = await graphql({
      schema, source: CREATE_ORDER, contextValue: ctx,
      variableValues: { wardUnitId: 'ward-1', lines: [{ medicationId: 'med-1', quantity: 20 }] },
    });
    const orderId = (created.data as any)?.createOrder.order.id;

    await graphql({ schema, source: SEND_ORDER, contextValue: ctx, variableValues: { orderId } });
    await graphql({ schema, source: CONFIRM_ORDER, contextValue: pharmacistCtx, variableValues: { orderId } });

    const result = await graphql({ schema, source: DELIVER_ORDER, contextValue: pharmacistCtx, variableValues: { orderId, productSelections: [{ medicationId: 'med-1', medicinalProductId: 'prod-1', quantity: 20 }] } });

    expect(result.errors).toBeUndefined();
    expect((result.data as any)?.deliverOrder.successful).toBe(true);
    expect((result.data as any)?.deliverOrder.order.status).toBe('Delivered');
    expect((await ctx.medicinalProductRepo.findByMedicationId('med-1' as MedicationId))[0]?.stockLevel).toBe(30);
  });
});

describe('Query.wardUnit with nested orders', () => {
  it('returns a ward unit with its orders and medication details', async () => {
    const ctx = createTestContext('nurse-1');
    await ctx.wardUnitRepo.save(new WardUnit('ward-1' as WardUnitId, 'Akuten'));
    await ctx.medicationRepo.save(
      new Medication('med-1' as MedicationId, 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg'),
    );
    await graphql({
      schema, source: CREATE_ORDER, contextValue: ctx,
      variableValues: { wardUnitId: 'ward-1', lines: [{ medicationId: 'med-1', quantity: 5 }] },
    });

    const result = await graphql({
      schema,
      source: /* GraphQL */ `{
        wardUnit(id: "ward-1") {
          name
          orders {
            status
            lines {
              quantity
              medication { innName }
            }
          }
        }
      }`,
      contextValue: ctx,
    });

    expect(result.errors).toBeUndefined();
    const ward = (result.data as any)?.wardUnit;
    expect(ward.name).toBe('Akuten');
    expect(ward.orders).toHaveLength(1);
    expect(ward.orders[0].lines[0].medication.innName).toBe('Paracetamol');
  });
});
