import bcrypt from 'bcryptjs';
import { CredentialsRepository } from './CredentialsRepository';
import { AuditRepository } from '../audit/AuditRepository';

export class ChangePasswordUseCase {
  constructor(
    private readonly credentials: CredentialsRepository,
    private readonly audit: AuditRepository,
  ) {}

  async execute(actorId: string, oldPassword: string, newPassword: string): Promise<void> {
    const creds = await this.credentials.findByActorId(actorId);
    if (!creds || !(await bcrypt.compare(oldPassword, creds.passwordHash))) {
      throw new Error('InvalidCredentials');
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await this.credentials.setPasswordHash(actorId, hash);
    await this.audit.record({ actorId, action: 'PasswordChanged', entityId: actorId, occurredAt: new Date() });
  }
}
