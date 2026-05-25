import { ActorRole } from '../shared/ActorRole';

export interface Credentials {
  actorId: string;
  passwordHash: string;
  role: ActorRole;
}

export interface CredentialsRepository {
  findByActorId(id: string): Promise<Credentials | undefined>;
  setPasswordHash(actorId: string, passwordHash: string): Promise<void>;
}
