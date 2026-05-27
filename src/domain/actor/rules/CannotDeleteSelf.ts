import { Actor } from '../../shared/Actor';
import { ErrorInfo } from '../../shared/results/ErrorInfo';
import { DeleteActorRule } from './interfaces/DeleteActorRule';

// An admin may not delete their own account
export class CannotDeleteSelf implements DeleteActorRule {
  check(requestingActor: Actor, target: Actor): ErrorInfo | null {
    if (requestingActor.id === target.id) {
      return new ErrorInfo('CannotDeleteSelf');
    }
    return null;
  }
}
