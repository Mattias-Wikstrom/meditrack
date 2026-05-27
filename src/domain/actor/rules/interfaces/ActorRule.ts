import { Actor } from '../../../shared/Actor';
import { ErrorInfo } from '../../../shared/results/ErrorInfo';

export interface ActorRule {
  check(actor: Actor): ErrorInfo | null;
}
