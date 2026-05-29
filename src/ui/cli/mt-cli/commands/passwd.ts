import readline from 'readline';
import { PrismaClient } from '@prisma/client';
import { PrismaCredentialsRepository } from '../../../../storage/prisma/PrismaCredentialsRepository';
import { PrismaAuditRepository } from '../../../../storage/prisma/PrismaAuditRepository';
import { SetPasswordUseCase } from '../../../../domain/auth/SetPasswordUseCase';
import { CliOutput } from '../CliOutput';

export async function passwd(prisma: PrismaClient, output: CliOutput, actorId: string): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  function askHidden(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      (rl as any)._writeToOutput = (str: string) => {
        if (str === prompt) process.stdout.write(str);
      };
      rl.question(prompt, (answer) => {
        process.stdout.write('\n');
        resolve(answer);
      });
    });
  }

  const password = await askHidden('New password: ');
  const confirm  = await askHidden('Confirm password: ');
  rl.close();

  if (password.length === 0) {
    output.error('Password cannot be empty.');
    process.exit(1);
  }
  if (password !== confirm) {
    output.error('Passwords do not match.');
    process.exit(1);
  }

  const useCase = new SetPasswordUseCase(new PrismaCredentialsRepository(prisma), new PrismaAuditRepository(prisma));
  try {
    await useCase.execute(actorId, password);
    output.print('Password updated.');
  } catch (e) {
    output.error(e instanceof Error && e.message === 'ActorNotFound'
      ? `Actor not found: ${actorId}`
      : 'Failed to update password.');
    process.exit(1);
  }
}
