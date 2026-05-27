import { describe, it, expect, beforeEach } from 'vitest';
import { observing } from '../../src/infrastructure/repositoryChange/observing';
import { InMemoryMedicinalProductRepository } from '../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { MedicinalProduct } from '../../src/domain/medication/MedicinalProduct';
import type { RepositoryChange, RepositoryChangeBus } from '../../src/infrastructure/repositoryChange/RepositoryChangeBus';

function makeProduct(overrides: Partial<{
  id: string; productName: string; medicationId: string;
  stockLevel: number; stockThreshold: number;
}> = {}) {
  return new MedicinalProduct(
    (overrides.id ?? 'prod-1') as any,
    overrides.productName ?? 'Test Product',
    (overrides.medicationId ?? 'med-1') as any,
    overrides.stockLevel ?? 100,
    overrides.stockThreshold ?? 20,
  );
}

function capturingBus(): { changes: RepositoryChange[]; bus: RepositoryChangeBus } {
  const changes: RepositoryChange[] = [];
  return { changes, bus: { publish: c => { changes.push(c); } } };
}

describe('observing()', () => {
  let inner: InMemoryMedicinalProductRepository;

  beforeEach(() => {
    inner = new InMemoryMedicinalProductRepository();
  });

  it('publishes a saved change after save()', async () => {
    const { changes, bus } = capturingBus();
    const repo = observing(inner, 'MedicinalProduct', bus);
    const product = makeProduct({ stockLevel: 42 });

    await repo.save(product);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({ kind: 'saved', entityType: 'MedicinalProduct', entity: product });
  });

  it('publishes a deleted change after delete()', async () => {
    const { changes, bus } = capturingBus();
    const repo = observing(inner, 'MedicinalProduct', bus);
    const product = makeProduct();
    await repo.save(product);
    changes.length = 0;

    await repo.delete(product.id);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({ kind: 'deleted', entityType: 'MedicinalProduct', id: product.id });
  });

  it('does not publish on read operations', async () => {
    const { changes, bus } = capturingBus();
    const repo = observing(inner, 'MedicinalProduct', bus);

    await repo.findAll();
    await repo.findById('prod-1' as any);
    await repo.findByMedicationId('med-1' as any);

    expect(changes).toHaveLength(0);
  });

  it('delegates reads to the inner repository', async () => {
    const { bus } = capturingBus();
    const repo = observing(inner, 'MedicinalProduct', bus);
    const product = makeProduct();
    await repo.save(product);

    expect(await repo.findById(product.id)).toBe(product);
    expect(await repo.findAll()).toHaveLength(1);
  });

  it('publishes with the entity type provided at construction', async () => {
    const { changes, bus } = capturingBus();
    const repo = observing(inner, 'SomeOtherType', bus);

    await repo.save(makeProduct());

    expect(changes[0]!.entityType).toBe('SomeOtherType');
  });
});
