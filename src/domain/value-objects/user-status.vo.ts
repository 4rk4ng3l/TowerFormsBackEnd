export enum UserStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export class UserStatusVO {
  private constructor(private readonly value: UserStatus) {}

  static fromString(status: string): UserStatusVO {
    const upperStatus = status.toUpperCase();

    if (!Object.values(UserStatus).includes(upperStatus as UserStatus)) {
      throw new Error(`Invalid user status: ${status}`);
    }

    return new UserStatusVO(upperStatus as UserStatus);
  }

  static pendingApproval(): UserStatusVO {
    return new UserStatusVO(UserStatus.PENDING_APPROVAL);
  }

  static active(): UserStatusVO {
    return new UserStatusVO(UserStatus.ACTIVE);
  }

  static inactive(): UserStatusVO {
    return new UserStatusVO(UserStatus.INACTIVE);
  }

  getValue(): UserStatus {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: UserStatusVO): boolean {
    return this.value === other.value;
  }

  isPending(): boolean {
    return this.value === UserStatus.PENDING_APPROVAL;
  }

  isActive(): boolean {
    return this.value === UserStatus.ACTIVE;
  }

  isInactive(): boolean {
    return this.value === UserStatus.INACTIVE;
  }

  canLogin(): boolean {
    return this.value === UserStatus.ACTIVE;
  }

  canBeApproved(): boolean {
    return this.value === UserStatus.PENDING_APPROVAL;
  }

  canBeDeactivated(): boolean {
    return this.value === UserStatus.ACTIVE;
  }

  canBeReactivated(): boolean {
    return this.value === UserStatus.INACTIVE;
  }
}
