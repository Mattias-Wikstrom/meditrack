import { WardUnit } from './WardUnit';
import { WardUnitId } from '../shared/IdTypes';

export interface WardUnitRepository {
  findById(id: WardUnitId): Promise<WardUnit | undefined>;
  findAll(): Promise<WardUnit[]>;
  save(wardUnit: WardUnit): Promise<void>;
}
