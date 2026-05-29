import { CliOutput } from './CliOutput';

export class ConsoleOutput implements CliOutput {
  print(message: string): void {
    console.log(message);
  }

  error(message: string): void {
    console.error(message);
  }

  exit(code: number): never {
    process.exit(code);
  }
}
