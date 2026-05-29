import { PrismaClient } from '@prisma/client';
import { PrismaCredentialsRepository } from '../../../../storage/prisma/PrismaCredentialsRepository';
import { PrismaAuditRepository } from '../../../../storage/prisma/PrismaAuditRepository';
import { LoginUseCase } from '../../../../domain/auth/LoginUseCase';
import { storeToken } from '../auth/tokenStore';
import { CliOutput } from '../CliOutput';

export async function login(
  prisma: PrismaClient,
  output: CliOutput,
  actorId: string,
  password: string,
): Promise<void> {
  const useCase = new LoginUseCase(new PrismaCredentialsRepository(prisma), new PrismaAuditRepository(prisma));
  try {
    const token = await useCase.execute(actorId, password);
    storeToken(token);
    output.print(`Logged in as ${actorId}.`);
  } catch {
    output.error('Login failed: invalid actor ID or password.');
    process.exit(1);
  }
}
