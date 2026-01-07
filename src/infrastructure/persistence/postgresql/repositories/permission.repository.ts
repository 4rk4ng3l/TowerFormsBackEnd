import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { IPermissionRepository } from '@domain/repositories/permission.repository.interface';
import { Permission } from '@domain/entities/permission.entity';

@injectable()
export class PermissionRepository implements IPermissionRepository {
  constructor(
    @inject('PrismaClient') private readonly prisma: PrismaClient
  ) {}

  async findById(id: string): Promise<Permission | null> {
    const permissionData = await this.prisma.permission.findUnique({
      where: { id }
    });

    if (!permissionData) {
      return null;
    }

    return this.toDomain(permissionData);
  }

  async findByResource(resource: string): Promise<Permission[]> {
    const permissions = await this.prisma.permission.findMany({
      where: { resource }
    });

    return permissions.map(permission => this.toDomain(permission));
  }

  async findByAction(action: string): Promise<Permission[]> {
    const permissions = await this.prisma.permission.findMany({
      where: { action }
    });

    return permissions.map(permission => this.toDomain(permission));
  }

  async findByResourceAction(resource: string, action: string): Promise<Permission | null> {
    const permissionData = await this.prisma.permission.findUnique({
      where: {
        resource_action: {
          resource,
          action
        }
      }
    });

    if (!permissionData) {
      return null;
    }

    return this.toDomain(permissionData);
  }

  async findByRoleId(roleId: string): Promise<Permission[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true
      }
    });

    return rolePermissions.map(rp => this.toDomain(rp.permission));
  }

  async create(entity: Permission): Promise<Permission> {
    const permissionData = await this.prisma.permission.create({
      data: {
        id: entity.id,
        resource: entity.resource,
        action: entity.action,
        description: entity.description
      }
    });

    return this.toDomain(permissionData);
  }

  async update(entity: Permission): Promise<Permission> {
    const permissionData = await this.prisma.permission.update({
      where: { id: entity.id },
      data: {
        resource: entity.resource,
        action: entity.action,
        description: entity.description
      }
    });

    return this.toDomain(permissionData);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.permission.delete({
      where: { id }
    });
  }

  async exists(resource: string, action: string): Promise<boolean> {
    const count = await this.prisma.permission.count({
      where: {
        resource,
        action
      }
    });

    return count > 0;
  }

  private toDomain(data: any): Permission {
    return Permission.create(
      data.id,
      data.resource,
      data.action,
      data.description
    );
  }
}
