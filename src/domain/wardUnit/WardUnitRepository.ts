import { WardUnit } from './WardUnit';

export interface WardUnitRepository {
  findById(id: string): WardUnit | undefined;
  findAll(): WardUnit[];
  save(wardUnit: WardUnit): void;
}
