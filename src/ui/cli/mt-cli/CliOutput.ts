export interface CliOutput {
  print(message: string): void;
  error(message: string): void;
  exit(code: number): never;
}
