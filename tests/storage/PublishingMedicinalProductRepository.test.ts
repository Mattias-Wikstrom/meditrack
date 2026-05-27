import { describe, it, expect, beforeEach } from 'vitest';
import { PublishingMedicinalProductRepository } from '../../src/storage/PublishingMedicinalProductRepository';
import { InMemoryMedicinalProductRepository } from '../../src/storage/inMemory/InMemoryMedicinalProductRepository';
import { SimpleEventBus } from '../../src/eventBus/SimpleEventBus';
import { MedicinalProduct } from '../../src/domain/medication/MedicinalProduct';
import { MedicinalProductChanged } from '../../src/domain/medication/events/MedicinalProductChanged';
import { DomainEvent } from '../../src/domain/shared/eventContracts/DomainEvent';

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

describe('PublishingMedicinalProductRepository', () => {
  let inner: InMemoryMedicinalProductRepository;
  let bus: SimpleEventBus;
  let repo: PublishingMedicinalProductRepository;
  let published: DomainEvent[];

  beforeEach(() => {
    inner = new InMemoryMedicinalProductRepository();
    bus = new SimpleEventBus();
    repo = new PublishingMedicinalProductRepository(inner, bus);
    published = [];
    bus.subscribe('MedicinalProductChanged', { handle: async e => { published.push(e); } });
  });

  it('publishes MedicinalProductChanged after save', async () => {
    const product = makeProduct({ stockLevel: 42 });
    await repo.save(product);

    expect(published).toHaveLength(1);
    const event = published[0] as MedicinalProductChanged;
    expect(event.eventType).toBe('MedicinalProductChanged');
    expect(event.id).toBe(product.id);
    expect(event.stockLevel).toBe(42);
    expect(event.isBelowThreshold).toBe(false);
  });

  it('publishes updated state when saved a second time', async () => {
    const product = makeProduct({ stockLevel: 50, stockThreshold: 30 });
    await repo.save(product);
    product.stockLevel = 25;
    await repo.save(product);

    expect(published).toHaveLength(2);
    const second = published[1] as MedicinalProductChanged;
    expect(second.stockLevel).toBe(25);
    expect(second.isBelowThreshold).toBe(true);
  });

  it('persists the product to the inner repository', async () => {
    const product = makeProduct();
    await repo.save(product);
    expect(await repo.findById(product.id)).toBe(product);
  });

  it('does not publish on read operations', async () => {
    await repo.findAll();
    await repo.findById('prod-1' as any);
    await repo.findByMedicationId('med-1' as any);
    expect(published).toHaveLength(0);
  });

  it('does not publish on delete', async () => {
    const product = makeProduct();
    await repo.save(product);
    published.length = 0;
    await repo.delete(product.id);
    expect(published).toHaveLength(0);
  });
});
