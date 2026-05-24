import { WardUnit } from '../../domain/wardUnit/WardUnit';
import { WardUnitRepository } from '../../domain/wardUnit/WardUnitRepository';
import { WardUnitId } from '../../domain/shared/Id';

export class InMemoryWardUnitRepository implements WardUnitRepository {
  private readonly store = new Map<WardUnitId, WardUnit>();

  findById(id: WardUnitId): WardUnit | undefined {
    return this.store.get(id);
  }

  findAll(): WardUnit[] {
    return Array.from(this.store.values());
  }

  save(wardUnit: WardUnit): void {
    this.store.set(wardUnit.id, wardUnit);
  }
}
