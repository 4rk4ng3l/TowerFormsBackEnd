export class EmailVO {
  private constructor(private readonly value: string) {}

  static fromString(email: string): EmailVO {
    const trimmedEmail = email.trim().toLowerCase();

    if (!EmailVO.isValid(trimmedEmail)) {
      throw new Error(`Invalid email format: ${email}`);
    }

    return new EmailVO(trimmedEmail);
  }

  private static isValid(email: string): boolean {
    // RFC 5322 simplified regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  }

  getValue(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: EmailVO): boolean {
    return this.value === other.value;
  }

  getDomain(): string {
    return this.value.split('@')[1];
  }

  getLocalPart(): string {
    return this.value.split('@')[0];
  }
}
