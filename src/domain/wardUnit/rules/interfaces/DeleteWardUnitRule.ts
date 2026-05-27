import { WardUnit } from '../../WardUnit';
import { Actor } from '../../../shared/Actor';
import { ErrorInfo } from '../../../shared/results/ErrorInfo';

export interface DeleteWardUnitRule {
  check(wardUnit: WardUnit, assignedNurses: Actor[]): ErrorInfo | null;
}
