import { ErrorInfo } from './ErrorInfo';

export type UseCaseResult<T> =
  | { successful: true; value: T }
  | { successful: false; errors: ErrorInfo[] };

export function success<T>(value: T): UseCaseResult<T> {
  return { successful: true, value };
}

export function failure<T>(ruleName: string, message: string): UseCaseResult<T> {
  return { successful: false, errors: [new ErrorInfo(ruleName, message)] };
}

export function failures<T>(errors: ErrorInfo[]): UseCaseResult<T> {
  return { successful: false, errors };
}
