import bcrypt from 'bcryptjs';
import { CredentialsRepository } from './CredentialsRepository';

export class SetPasswordUseCase {
  constructor(private readonly credentials: CredentialsRepository) {}

  async execute(actorId: string, newPassword: string): Promise<void> {
    const hash = await bcrypt.hash(newPassword, 10);
    await this.credentials.setPasswordHash(actorId, hash);
  }
}
