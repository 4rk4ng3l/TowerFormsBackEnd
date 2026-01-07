export class RefreshToken {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly token: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
    public readonly revokedAt: Date | null
  ) {}

  static create(
    id: string,
    userId: string,
    token: string,
    expiresAt: Date
  ): RefreshToken {
    return new RefreshToken(
      id,
      userId,
      token,
      expiresAt,
      new Date(),
      null
    );
  }

  revoke(): RefreshToken {
    if (this.isRevoked()) {
      return this;
    }

    return new RefreshToken(
      this.id,
      this.userId,
      this.token,
      this.expiresAt,
      this.createdAt,
      new Date()
    );
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isRevoked(): boolean {
    return this.revokedAt !== null;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }

  canBeUsed(): boolean {
    return this.isValid();
  }

  getRemainingTimeMs(): number {
    if (this.isExpired()) {
      return 0;
    }

    return this.expiresAt.getTime() - new Date().getTime();
  }

  getRemainingDays(): number {
    return Math.floor(this.getRemainingTimeMs() / (1000 * 60 * 60 * 24));
  }
}
