import { Actor } from '../../shared/Actor';
import { ActorRole } from '../../shared/ActorRole';
import { ErrorInfo } from '../../shared/results/ErrorInfo';
import { ActorRule } from './interfaces/ActorRule';

// A nurse must always be assigned to a ward unit
export class NurseRequiresWardUnit implements ActorRule {
  check(actor: Actor): ErrorInfo | null {
    if (actor.role === ActorRole.Nurse && !actor.wardUnitId) {
      return new ErrorInfo('NurseRequiresWardUnit');
    }
    return null;
  }
}
