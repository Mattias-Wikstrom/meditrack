import { MedicinalProduct } from '../domain/medication/MedicinalProduct';
import { MedicinalProductRepository } from '../domain/medication/MedicinalProductRepository';
import { MedicinalProductChanged } from '../domain/medication/events/MedicinalProductChanged';
import { EventBus } from '../domain/shared/eventContracts/EventBus';
import { MedicationId, MedicinalProductId } from '../domain/shared/IdTypes';

export class PublishingMedicinalProductRepository implements MedicinalProductRepository {
  constructor(
    private readonly inner: MedicinalProductRepository,
    private readonly eventBus: EventBus,
  ) {}

  findById(id: MedicinalProductId) { return this.inner.findById(id); }
  findByMedicationId(medicationId: MedicationId) { return this.inner.findByMedicationId(medicationId); }
  findAll() { return this.inner.findAll(); }
  delete(id: MedicinalProductId) { return this.inner.delete(id); }

  async save(product: MedicinalProduct): Promise<void> {
    await this.inner.save(product);
    await this.eventBus.publish(new MedicinalProductChanged(product));
  }
}
