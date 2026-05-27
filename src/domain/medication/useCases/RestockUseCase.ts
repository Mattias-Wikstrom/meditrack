import { MedicinalProduct } from '../MedicinalProduct';
import { MedicinalProductRepository } from '../MedicinalProductRepository';
import { ActorRepository } from '../../actor/ActorRepository';
import { ActorRole } from '../../shared/ActorRole';
import { Transactor } from '../../shared/Transactor';
import { UseCaseResult, success, failure, failures } from '../../shared/results/UseCaseResult';
import { MedicinalProductId } from '../../shared/IdTypes';
import { RestockRule } from '../rules/RestockRule';
import { RestockQuantityPositive } from '../rules/RestockQuantityPositive';
import { ErrorInfo } from '../../shared/results/ErrorInfo';

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

    const product = await this.medicinalProductRepository.findById(input.medicinalProductId);
    if (product === undefined) return failure('MedicinalProductNotFound');

    product.stockLevel = product.stockLevel + input.quantity;

    await this.transactor.run(async (tx) => {
      await tx.medicinalProductRepository.save(product);
      await tx.auditRepository.record({
        actorId: input.actorId,
        action: 'ProductRestocked',
        entityId: product.id,
        occurredAt: new Date(),
      });
    });

    return success(product);
  }
}
