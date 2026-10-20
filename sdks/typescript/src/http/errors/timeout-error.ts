import { PostmanCusteduApiError } from './throwable-error';

/**
 * Thrown when a request is aborted by the configured timeout before a response is received.
 */
export class PostmanCusteduApiTimeoutError extends PostmanCusteduApiError {
  constructor(message: string, opts?: { cause?: unknown }) {
    super({ message, cause: opts?.cause });
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = 'PostmanCusteduApiTimeoutError';
  }
}
