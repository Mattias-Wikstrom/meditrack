import { WardUnit } from '../../domain/wardUnit/WardUnit';
import { WardUnitRepository } from '../../domain/wardUnit/WardUnitRepository';

export class InMemoryWardUnitRepository implements WardUnitRepository {
  private readonly store = new Map<string, WardUnit>();

  findById(id: string): WardUnit | undefined {
    return this.store.get(id);
  }

  findAll(): WardUnit[] {
    return Array.from(this.store.values());
  }

  save(wardUnit: WardUnit): void {
    this.store.set(wardUnit.id, wardUnit);
  }
}
