import readline from 'readline';
import { PrismaClient } from '@prisma/client';
import { PrismaCredentialsRepository } from '../../../storage/prisma/PrismaCredentialsRepository';
import { SetPasswordUseCase } from '../../../domain/auth/SetPasswordUseCase';
import { CliOutput } from '../CliOutput';

function promptHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    // Suppress character echo while still showing the prompt itself
    (rl as any)._writeToOutput = (str: string) => {
      if (str === prompt) process.stdout.write(str);
    };
    rl.question(prompt, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

export async function passwd(prisma: PrismaClient, output: CliOutput, actorId: string): Promise<void> {
  const password = await promptHidden('New password: ');
  const confirm  = await promptHidden('Confirm password: ');

  if (password.length === 0) {
    output.error('Password cannot be empty.');
    process.exit(1);
  }
  if (password !== confirm) {
    output.error('Passwords do not match.');
    process.exit(1);
  }

  const useCase = new SetPasswordUseCase(new PrismaCredentialsRepository(prisma));
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
