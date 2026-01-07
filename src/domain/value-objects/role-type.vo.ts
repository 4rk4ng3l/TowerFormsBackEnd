export enum RoleType {
  ADMIN = 'Administrador',
  TECHNICIAN = 'Técnico de Campo',
  CONSULTANT = 'Consultor'
}

export class RoleTypeVO {
  private constructor(private readonly value: RoleType) {}

  static fromString(role: string): RoleTypeVO {
    const normalizedRole = role.trim();

    if (!Object.values(RoleType).includes(normalizedRole as RoleType)) {
      throw new Error(`Invalid role type: ${role}. Valid roles: ${Object.values(RoleType).join(', ')}`);
    }

    return new RoleTypeVO(normalizedRole as RoleType);
  }

  static admin(): RoleTypeVO {
    return new RoleTypeVO(RoleType.ADMIN);
  }

  static technician(): RoleTypeVO {
    return new RoleTypeVO(RoleType.TECHNICIAN);
  }

  static consultant(): RoleTypeVO {
    return new RoleTypeVO(RoleType.CONSULTANT);
  }

  getValue(): RoleType {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: RoleTypeVO): boolean {
    return this.value === other.value;
  }

  isAdmin(): boolean {
    return this.value === RoleType.ADMIN;
  }

  isTechnician(): boolean {
    return this.value === RoleType.TECHNICIAN;
  }

  isConsultant(): boolean {
    return this.value === RoleType.CONSULTANT;
  }

  canManageUsers(): boolean {
    return this.isAdmin();
  }

  canManageForms(): boolean {
    return this.isAdmin();
  }

  canCreateSubmissions(): boolean {
    return this.isTechnician() || this.isAdmin();
  }

  canViewAllSubmissions(): boolean {
    return this.isAdmin() || this.isConsultant();
  }

  canExportSubmissions(): boolean {
    return this.isAdmin() || this.isConsultant();
  }
}
