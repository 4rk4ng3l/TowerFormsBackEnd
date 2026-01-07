import { EmailVO } from '../value-objects/email.vo';
import { UserStatusVO } from '../value-objects/user-status.vo';
import { Role } from './role.entity';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: EmailVO,
    public readonly passwordHash: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly status: UserStatusVO,
    public readonly role: Role,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly approvedAt: Date | null,
    public readonly approvedBy: string | null,
    public readonly lastLoginAt: Date | null
  ) {}

  static create(
    id: string,
    email: EmailVO,
    passwordHash: string,
    firstName: string,
    lastName: string,
    role: Role
  ): User {
    return new User(
      id,
      email,
      passwordHash,
      firstName,
      lastName,
      UserStatusVO.pendingApproval(),
      role,
      new Date(),
      new Date(),
      null,
      null,
      null
    );
  }

  static createActive(
    id: string,
    email: EmailVO,
    passwordHash: string,
    firstName: string,
    lastName: string,
    role: Role,
    approvedBy: string | null = null
  ): User {
    return new User(
      id,
      email,
      passwordHash,
      firstName,
      lastName,
      UserStatusVO.active(),
      role,
      new Date(),
      new Date(),
      new Date(),
      approvedBy,
      null
    );
  }

  approve(approverId: string): User {
    if (!this.status.canBeApproved()) {
      throw new Error('User cannot be approved - not in pending status');
    }

    if (this.id === approverId) {
      throw new Error('User cannot approve their own registration');
    }

    return new User(
      this.id,
      this.email,
      this.passwordHash,
      this.firstName,
      this.lastName,
      UserStatusVO.active(),
      this.role,
      this.createdAt,
      new Date(),
      new Date(),
      approverId,
      this.lastLoginAt
    );
  }

  activate(): User {
    if (this.status.isActive()) {
      return this;
    }

    return new User(
      this.id,
      this.email,
      this.passwordHash,
      this.firstName,
      this.lastName,
      UserStatusVO.active(),
      this.role,
      this.createdAt,
      new Date(),
      this.approvedAt,
      this.approvedBy,
      this.lastLoginAt
    );
  }

  deactivate(): User {
    if (!this.status.canBeDeactivated()) {
      throw new Error('User cannot be deactivated - not in active status');
    }

    return new User(
      this.id,
      this.email,
      this.passwordHash,
      this.firstName,
      this.lastName,
      UserStatusVO.inactive(),
      this.role,
      this.createdAt,
      new Date(),
      this.approvedAt,
      this.approvedBy,
      this.lastLoginAt
    );
  }

  changePassword(newPasswordHash: string): User {
    return new User(
      this.id,
      this.email,
      newPasswordHash,
      this.firstName,
      this.lastName,
      this.status,
      this.role,
      this.createdAt,
      new Date(),
      this.approvedAt,
      this.approvedBy,
      this.lastLoginAt
    );
  }

  updateLastLogin(): User {
    return new User(
      this.id,
      this.email,
      this.passwordHash,
      this.firstName,
      this.lastName,
      this.status,
      this.role,
      this.createdAt,
      new Date(),
      this.approvedAt,
      this.approvedBy,
      new Date()
    );
  }

  updateRole(newRole: Role): User {
    return new User(
      this.id,
      this.email,
      this.passwordHash,
      this.firstName,
      this.lastName,
      this.status,
      newRole,
      this.createdAt,
      new Date(),
      this.approvedAt,
      this.approvedBy,
      this.lastLoginAt
    );
  }

  updateProfile(firstName: string, lastName: string): User {
    return new User(
      this.id,
      this.email,
      this.passwordHash,
      firstName,
      lastName,
      this.status,
      this.role,
      this.createdAt,
      new Date(),
      this.approvedAt,
      this.approvedBy,
      this.lastLoginAt
    );
  }

  isActive(): boolean {
    return this.status.isActive();
  }

  isPending(): boolean {
    return this.status.isPending();
  }

  isInactive(): boolean {
    return this.status.isInactive();
  }

  canLogin(): boolean {
    return this.status.canLogin();
  }

  isAdmin(): boolean {
    return this.role.isAdmin();
  }

  isTechnician(): boolean {
    return this.role.isTechnician();
  }

  isConsultant(): boolean {
    return this.role.isConsultant();
  }

  hasPermission(resource: string, action: string): boolean {
    return this.role.hasPermissionByResourceAction(resource, action);
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  isValid(): boolean {
    return (
      this.firstName.trim().length > 0 &&
      this.lastName.trim().length > 0 &&
      this.passwordHash.trim().length > 0 &&
      this.role.isValid()
    );
  }
}
