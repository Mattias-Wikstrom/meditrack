import { WardUnit } from './WardUnit';
import { WardUnitId } from '../shared/Id';

export interface WardUnitRepository {
  findById(id: WardUnitId): WardUnit | undefined;
  findAll(): WardUnit[];
  save(wardUnit: WardUnit): void;
}
