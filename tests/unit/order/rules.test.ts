import { describe, it, expect } from 'vitest';
import { Order } from '../../../src/domain/order/Order';
import { OrderLine } from '../../../src/domain/order/OrderLine';
import { OrderStatus } from '../../../src/domain/order/OrderStatus';
import { OrderHasAtLeastOneLine } from '../../../src/domain/order/rules/OrderHasAtLeastOneLine';
import { OrderLineQuantitiesPositive } from '../../../src/domain/order/rules/OrderLineQuantitiesPositive';
import { MedicationId, OrderId, WardUnitId } from '../../../src/domain/shared/IdTypes';

const makeOrder = (lines: OrderLine[]) =>
  new Order('order-1' as OrderId, 'ward-1' as WardUnitId, lines, OrderStatus.Draft, new Date());

describe('OrderHasAtLeastOneLine', () => {
  const rule = new OrderHasAtLeastOneLine();

  it('returns an error when there are no lines', () => {
    expect(rule.check(makeOrder([]))).not.toBeNull();
  });

  it('returns null when there is at least one line', () => {
    expect(rule.check(makeOrder([new OrderLine('med-1' as MedicationId,5)]))).toBeNull();
  });
});

describe('OrderLineQuantitiesPositive', () => {
  const rule = new OrderLineQuantitiesPositive();

  it('returns an error when a quantity is zero', () => {
    expect(rule.check(makeOrder([new OrderLine('med-1' as MedicationId,0)]))).not.toBeNull();
  });

  it('returns an error when a quantity is negative', () => {
    expect(rule.check(makeOrder([new OrderLine('med-1' as MedicationId,-3)]))).not.toBeNull();
  });

  it('returns null when all quantities are positive', () => {
    const lines = [new OrderLine('med-1' as MedicationId,5), new OrderLine('med-2' as MedicationId,10)];
    expect(rule.check(makeOrder(lines))).toBeNull();
  });
});
