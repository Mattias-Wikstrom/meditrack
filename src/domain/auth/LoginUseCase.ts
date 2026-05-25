import bcrypt from 'bcryptjs';
import { CredentialsRepository } from './CredentialsRepository';
import { AuditRepository } from '../audit/AuditRepository';
import { signToken } from './jwt';

export class LoginUseCase {
  constructor(
    private readonly credentials: CredentialsRepository,
    private readonly audit: AuditRepository,
  ) {}

  async execute(actorId: string, password: string): Promise<string> {
    const creds = await this.credentials.findByActorId(actorId);
    if (!creds || !(await bcrypt.compare(password, creds.passwordHash))) {
      await this.audit.record({ actorId, action: 'ActorLoginFailed', entityId: actorId, occurredAt: new Date() });
      throw new Error('InvalidCredentials');
    }
    await this.audit.record({ actorId, action: 'ActorLoggedIn', entityId: actorId, occurredAt: new Date() });
    return signToken({ actorId, role: creds.role });
  }
}
