import { WardUnitId } from '../shared/IdTypes';

export class WardUnit {
  constructor(
    public readonly id: WardUnitId,
    public readonly name: string,
  ) {}
}
