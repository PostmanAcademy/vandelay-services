import { PostmanCusteduApiError } from '../../http/errors/throwable-error';
import { RawResponse } from '../../http/utils/fetcher';
import { Problem } from '../types/Problem';

export class UnprocessableEntityError extends PostmanCusteduApiError {
  public declare readonly body: Problem;

  constructor(body: Problem, rawResponse?: RawResponse) {
    super({ message: 'UnprocessableEntityError', statusCode: 422, body, rawResponse });
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = 'UnprocessableEntityError';
  }
}
