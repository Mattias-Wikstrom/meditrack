import { MedicinalProduct } from '../MedicinalProduct';
import { MedicinalProductRepository } from '../MedicinalProductRepository';
import { ActorRepository } from '../../actor/ActorRepository';
import { ActorRole } from '../../shared/ActorRole';
import { Transactor } from '../../shared/Transactor';
import { EventBus } from '../../shared/eventContracts/EventBus';
import { UseCaseResult, success, failure, failures } from '../../shared/results/UseCaseResult';
import { MedicinalProductId } from '../../shared/IdTypes';
import { RestockRule } from '../rules/interfaces/RestockRule';
import { RestockQuantityPositive } from '../rules/RestockQuantityPositive';
import { ProductRestocked } from '../events/ProductRestocked';
import { ErrorInfo } from '../../shared/results/ErrorInfo';
import { ConflictError } from '../../shared/ConflictError';

export interface RestockInput {
  actorId: string;
  medicinalProductId: MedicinalProductId;
  quantity: number; // Units to add to current stock
}

export class RestockUseCase {
  private readonly rules: RestockRule[] = [
    new RestockQuantityPositive(),
  ];

  constructor(
    private readonly actorRepository: ActorRepository,
    private readonly medicinalProductRepository: MedicinalProductRepository,
    private readonly transactor: Transactor,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: RestockInput): Promise<UseCaseResult<MedicinalProduct>> {
    const actor = await this.actorRepository.findById(input.actorId);
    if (actor === undefined) return failure('ActorNotFound');
    if (actor.role !== ActorRole.Pharmacist) return failure('UnauthorizedRole');

    const errors: ErrorInfo[] = [];
    for (const rule of this.rules) {
      const error = rule.check(input.quantity);
      if (error !== null) errors.push(error);
    }
    if (errors.length > 0) return failures(errors);

    for (let attempt = 0; attempt < 3; attempt++) {
      const product = await this.medicinalProductRepository.findById(input.medicinalProductId);
      if (product === undefined) return failure('MedicinalProductNotFound');

      const previousLevel = product.stockLevel;
      const newLevel = previousLevel + input.quantity;

      try {
        await this.transactor.run(async (tx) => {
          await tx.medicinalProductRepository.adjustStock(product.id, newLevel, previousLevel);
          await tx.auditRepository.record({
            actorId: input.actorId,
            action: 'ProductRestocked',
            entityId: product.id,
            occurredAt: new Date(),
          });
        });
      } catch (e) {
        if (e instanceof ConflictError) continue;
        throw e;
      }

      product.stockLevel = newLevel;
      await this.eventBus.publish(new ProductRestocked(input.actorId, product));
      return success(product);
    }

    return failure('Conflict');
  }
}
