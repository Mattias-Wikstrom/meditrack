import { WardUnitId } from '../shared/Id';

export class WardUnit {
  constructor(
    public readonly id: WardUnitId,
    public readonly name: string,
  ) {}
}
