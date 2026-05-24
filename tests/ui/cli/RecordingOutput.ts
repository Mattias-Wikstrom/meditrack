import { CliOutput } from '../../../src/ui/cli/CliOutput';

export class ExitError extends Error {
  constructor(public readonly code: number) {
    super(`exit(${code})`);
  }
}

export class RecordingOutput implements CliOutput {
  readonly messages: string[] = [];
  readonly errors: string[] = [];

  print(message: string): void {
    this.messages.push(message);
  }

  error(message: string): void {
    this.errors.push(message);
  }

  exit(code: number): never {
    throw new ExitError(code);
  }
}
