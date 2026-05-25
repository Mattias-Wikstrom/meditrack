import bcrypt from 'bcryptjs';
import { CredentialsRepository } from './CredentialsRepository';
import { signToken } from './jwt';

export class LoginUseCase {
  constructor(private readonly credentials: CredentialsRepository) {}

  async execute(actorId: string, password: string): Promise<string> {
    const creds = await this.credentials.findByActorId(actorId);
    if (!creds || !(await bcrypt.compare(password, creds.passwordHash))) {
      throw new Error('InvalidCredentials');
    }
    return signToken({ actorId, role: creds.role });
  }
}
