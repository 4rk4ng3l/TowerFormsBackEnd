export class PasswordVO {
  private constructor(private readonly value: string) {}

  static fromPlainText(password: string): PasswordVO {
    if (!PasswordVO.isValid(password)) {
      const errors = PasswordVO.getValidationErrors(password);
      throw new Error(`Invalid password: ${errors.join(', ')}`);
    }

    return new PasswordVO(password);
  }

  static fromHash(hash: string): PasswordVO {
    // Accept bcrypt hashes without validation
    if (!hash || hash.length === 0) {
      throw new Error('Password hash cannot be empty');
    }

    return new PasswordVO(hash);
  }

  private static isValid(password: string): boolean {
    return this.getValidationErrors(password).length === 0;
  }

  private static getValidationErrors(password: string): string[] {
    const errors: string[] = [];

    if (!password || password.length === 0) {
      errors.push('Password cannot be empty');
      return errors;
    }

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }

    // Optional: enforce complexity requirements
    // if (!/[A-Z]/.test(password)) {
    //   errors.push('Password must contain at least one uppercase letter');
    // }
    //
    // if (!/[a-z]/.test(password)) {
    //   errors.push('Password must contain at least one lowercase letter');
    // }
    //
    // if (!/[0-9]/.test(password)) {
    //   errors.push('Password must contain at least one digit');
    // }

    return errors;
  }

  getValue(): string {
    return this.value;
  }

  toString(): string {
    return '***';  // Never expose password in logs
  }

  equals(other: PasswordVO): boolean {
    return this.value === other.value;
  }

  getLength(): number {
    return this.value.length;
  }
}
