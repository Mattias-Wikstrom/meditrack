import bcrypt from 'bcryptjs';
import { CredentialsRepository } from './CredentialsRepository';
import { AuditRepository } from '../audit/AuditRepository';

export class SetPasswordUseCase {
  constructor(
    private readonly credentials: CredentialsRepository,
    private readonly audit: AuditRepository,
  ) {}

  async execute(actorId: string, newPassword: string): Promise<void> {
    const hash = await bcrypt.hash(newPassword, 10);
    await this.credentials.setPasswordHash(actorId, hash);
    await this.audit.record({ actorId, action: 'PasswordChanged', entityId: actorId, occurredAt: new Date() });
  }
}
