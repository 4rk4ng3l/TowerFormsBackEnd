import { Permission } from './permission.entity';

export class Role {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly isSystem: boolean,
    public readonly permissions: Permission[],
    public readonly createdAt: Date
  ) {}

  static create(
    id: string,
    name: string,
    description: string | null = null,
    isSystem: boolean = false
  ): Role {
    return new Role(
      id,
      name,
      description,
      isSystem,
      [],
      new Date()
    );
  }

  addPermission(permission: Permission): Role {
    if (this.hasPermission(permission.id)) {
      return this;
    }

    return new Role(
      this.id,
      this.name,
      this.description,
      this.isSystem,
      [...this.permissions, permission],
      this.createdAt
    );
  }

  removePermission(permissionId: string): Role {
    return new Role(
      this.id,
      this.name,
      this.description,
      this.isSystem,
      this.permissions.filter(p => p.id !== permissionId),
      this.createdAt
    );
  }

  hasPermission(permissionId: string): boolean {
    return this.permissions.some(p => p.id === permissionId);
  }

  hasPermissionByResourceAction(resource: string, action: string): boolean {
    return this.permissions.some(
      p => p.resource === resource && p.action === action
    );
  }

  canBeDeleted(): boolean {
    return !this.isSystem;
  }

  canBeModified(): boolean {
    return !this.isSystem;
  }

  isValid(): boolean {
    return this.name.trim().length > 0;
  }

  isAdmin(): boolean {
    return this.name === 'Administrador';
  }

  isTechnician(): boolean {
    return this.name === 'Técnico de Campo';
  }

  isConsultant(): boolean {
    return this.name === 'Consultor';
  }
}
