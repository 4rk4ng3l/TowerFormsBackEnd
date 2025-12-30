import { BaseException } from './base.exception';

export class ValidationException extends BaseException {
  constructor(
    message: string,
    public readonly errors: string[]
  ) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationException';
  }

  static fromErrors(errors: string[]): ValidationException {
    return new ValidationException(
      `Validation failed with ${errors.length} error(s)`,
      errors
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors
    };
  }
}
