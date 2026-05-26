import { Actor } from '../../shared/Actor';
import { ErrorInfo } from '../../shared/results/ErrorInfo';

export interface DeleteActorRule {
  check(requestingActor: Actor, target: Actor): ErrorInfo | null;
}
