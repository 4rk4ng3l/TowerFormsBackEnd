export class Result<T> {
  private constructor(
    private readonly success: boolean,
    private readonly value?: T,
    private readonly error?: string
  ) {}

  static ok<T>(value?: T): Result<T> {
    return new Result<T>(true, value);
  }

  static fail<T>(error: string): Result<T> {
    return new Result<T>(false, undefined, error);
  }

  isSuccess(): boolean {
    return this.success;
  }

  isFailure(): boolean {
    return !this.success;
  }

  getValue(): T {
    if (!this.success) {
      throw new Error('Cannot get value from a failed result');
    }
    return this.value!;
  }

  getError(): string {
    if (this.success) {
      throw new Error('Cannot get error from a successful result');
    }
    return this.error!;
  }

  map<U>(fn: (value: T) => U): Result<U> {
    if (this.isFailure()) {
      return Result.fail<U>(this.error!);
    }
    try {
      return Result.ok(fn(this.value!));
    } catch (error) {
      return Result.fail<U>(error instanceof Error ? error.message : String(error));
    }
  }

  flatMap<U>(fn: (value: T) => Result<U>): Result<U> {
    if (this.isFailure()) {
      return Result.fail<U>(this.error!);
    }
    try {
      return fn(this.value!);
    } catch (error) {
      return Result.fail<U>(error instanceof Error ? error.message : String(error));
    }
  }

  getOrElse(defaultValue: T): T {
    return this.success ? this.value! : defaultValue;
  }

  orElse(fn: (error: string) => Result<T>): Result<T> {
    return this.isFailure() ? fn(this.error!) : this;
  }
}
