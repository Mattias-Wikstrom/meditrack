import { Actor } from '../../shared/Actor';
import { ActorRole } from '../../shared/ActorRole';
import { ErrorInfo } from '../../shared/results/ErrorInfo';
import { ActorRule } from './ActorRule';

// Only nurses may be assigned to a ward unit
export class NonNurseCannotHaveWardUnit implements ActorRule {
  check(actor: Actor): ErrorInfo | null {
    if (actor.role !== ActorRole.Nurse && actor.wardUnitId != null) {
      return new ErrorInfo('WardUnitAssignmentNotAllowed');
    }
    return null;
  }
}
