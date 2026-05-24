import { ErrorInfo } from './ErrorInfo';
import { ErrorCode } from './ErrorCode';

export type UseCaseResult<T> =
  | { successful: true; value: T }
  | { successful: false; errors: ErrorInfo[] };

export function success<T>(value: T): UseCaseResult<T> {
  return { successful: true, value };
}

export function failure<T>(code: ErrorCode): UseCaseResult<T> {
  return { successful: false, errors: [new ErrorInfo(code)] };
}

export function failures<T>(errors: ErrorInfo[]): UseCaseResult<T> {
  return { successful: false, errors };
}
