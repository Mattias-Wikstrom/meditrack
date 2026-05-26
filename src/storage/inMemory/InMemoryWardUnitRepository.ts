import { WardUnit } from '../../domain/wardUnit/WardUnit';
import { WardUnitRepository } from '../../domain/wardUnit/WardUnitRepository';
import { WardUnitId } from '../../domain/shared/IdTypes';

export class InMemoryWardUnitRepository implements WardUnitRepository {
  private readonly store = new Map<WardUnitId, WardUnit>();

  async findById(id: WardUnitId): Promise<WardUnit | undefined> {
    return this.store.get(id);
  }

  async findAll(): Promise<WardUnit[]> {
    return Array.from(this.store.values());
  }

  async save(wardUnit: WardUnit): Promise<void> {
    this.store.set(wardUnit.id, wardUnit);
  }

  async delete(id: WardUnitId): Promise<void> {
    this.store.delete(id);
  }
}
