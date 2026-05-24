import { describe, it, expect } from 'vitest';
import { graphql } from 'graphql';
import { schema } from '../../src/graphql/schema';
import { createTestContext } from '../helpers/createTestContext';
import Decimal from 'decimal.js';
import { Medication } from '../../src/domain/medication/Medication';
import { MedicinalProduct } from '../../src/domain/medication/MedicinalProduct';
import { MedicationForm } from '../../src/domain/medication/MedicationForm';
import { MedicationId, MedicinalProductId, WardUnitId } from '../../src/domain/shared/Id';
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

const ADVANCE_STATUS = /* GraphQL */ `
  mutation AdvanceOrderStatus($orderId: ID!) {
    advanceOrderStatus(orderId: $orderId) {
      successful
      errors
      order { status }
    }
  }
`;

const DELIVER_ORDER = /* GraphQL */ `
  mutation DeliverOrder($orderId: ID!) {
    deliverOrder(orderId: $orderId) {
      successful
      errors
      order { status }
    }
  }
`;

describe('Mutation.createOrder', () => {
  it('returns a draft order on success', async () => {
    const ctx = createTestContext();

    const result = await graphql({
      schema,
      source: CREATE_ORDER,
      contextValue: ctx,
      variableValues: { wardUnitId: 'ward-1', lines: [{ medicationId: 'med-1', quantity: 5 }] },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.createOrder.successful).toBe(true);
    expect(result.data?.createOrder.order.status).toBe('Draft');
    expect(result.data?.createOrder.errors).toEqual([]);
  });

  it('returns errors and no order when validation fails', async () => {
    const ctx = createTestContext();

    const result = await graphql({
      schema,
      source: CREATE_ORDER,
      contextValue: ctx,
      variableValues: { wardUnitId: 'ward-1', lines: [] },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.createOrder.successful).toBe(false);
    expect(result.data?.createOrder.errors).toContain('OrderHasAtLeastOneLine');
    expect(result.data?.createOrder.order).toBeNull();
  });
});

describe('Mutation.advanceOrderStatus', () => {
  it('advances a draft order to sent', async () => {
    const ctx = createTestContext();
    const created = await graphql({
      schema, source: CREATE_ORDER, contextValue: ctx,
      variableValues: { wardUnitId: 'ward-1', lines: [{ medicationId: 'med-1', quantity: 5 }] },
    });
    const orderId = created.data?.createOrder.order.id;

    const result = await graphql({ schema, source: ADVANCE_STATUS, contextValue: ctx, variableValues: { orderId } });

    expect(result.errors).toBeUndefined();
    expect(result.data?.advanceOrderStatus.successful).toBe(true);
    expect(result.data?.advanceOrderStatus.order.status).toBe('Sent');
  });

  it('returns an error for an unknown order', async () => {
    const result = await graphql({
      schema, source: ADVANCE_STATUS, contextValue: createTestContext(),
      variableValues: { orderId: 'no-such-order' },
    });

    expect(result.data?.advanceOrderStatus.successful).toBe(false);
    expect(result.data?.advanceOrderStatus.errors).toContain('OrderNotFound');
  });
});

describe('Mutation.deliverOrder', () => {
  it('updates stock and marks order as delivered', async () => {
    const ctx = createTestContext();
    ctx.medicationRepo.save(
      new Medication('med-1' as MedicationId, 'Paracetamol', 'N02BE01', MedicationForm.Tablet, '500mg'),
    );
    ctx.medicinalProductRepo.save(
      new MedicinalProduct('prod-1' as MedicinalProductId, 'Paracetamol 500mg', 'med-1' as MedicationId, new Decimal(10), new Decimal(5)),
    );

    const created = await graphql({
      schema, source: CREATE_ORDER, contextValue: ctx,
      variableValues: { wardUnitId: 'ward-1', lines: [{ medicationId: 'med-1', quantity: 20 }] },
    });
    const orderId = created.data?.createOrder.order.id;

    await graphql({ schema, source: ADVANCE_STATUS, contextValue: ctx, variableValues: { orderId } });
    await graphql({ schema, source: ADVANCE_STATUS, contextValue: ctx, variableValues: { orderId } });

    const result = await graphql({ schema, source: DELIVER_ORDER, contextValue: ctx, variableValues: { orderId } });

    expect(result.errors).toBeUndefined();
    expect(result.data?.deliverOrder.successful).toBe(true);
    expect(result.data?.deliverOrder.order.status).toBe('Delivered');
    expect(ctx.medicinalProductRepo.findByMedicationId('med-1' as MedicationId)[0]?.stockLevel.toNumber()).toBe(30);
  });
});

describe('Query.wardUnit with nested orders', () => {
  it('returns a ward unit with its orders and medication details', async () => {
    const ctx = createTestContext();
    ctx.wardUnitRepo.save(new WardUnit('ward-1' as WardUnitId, 'Akuten'));
    ctx.medicationRepo.save(
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
    const ward = result.data?.wardUnit;
    expect(ward.name).toBe('Akuten');
    expect(ward.orders).toHaveLength(1);
    expect(ward.orders[0].lines[0].medication.innName).toBe('Paracetamol');
  });
});
