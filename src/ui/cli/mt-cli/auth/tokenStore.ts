import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const TOKEN_DIR = join(homedir(), '.meditrack');
const TOKEN_PATH = join(TOKEN_DIR, 'token');

export function storeToken(token: string): void {
  mkdirSync(TOKEN_DIR, { recursive: true });
  writeFileSync(TOKEN_PATH, token, 'utf8');
}

export function readToken(): string | undefined {
  try {
    return readFileSync(TOKEN_PATH, 'utf8').trim() || undefined;
  } catch {
    return undefined;
  }
}
