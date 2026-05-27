import { WardUnit } from '../WardUnit';
import { Actor } from '../../shared/Actor';
import { ErrorInfo } from '../../shared/results/ErrorInfo';
import { DeleteWardUnitRule } from './interfaces/DeleteWardUnitRule';

// A ward unit cannot be deleted while nurses are assigned to it
export class WardUnitHasNoNurses implements DeleteWardUnitRule {
  check(_wardUnit: WardUnit, assignedNurses: Actor[]): ErrorInfo | null {
    if (assignedNurses.length > 0) {
      return new ErrorInfo('WardUnitHasAssignedNurses');
    }
    return null;
  }
}
