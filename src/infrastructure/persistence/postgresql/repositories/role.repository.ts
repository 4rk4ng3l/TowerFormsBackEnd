import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { IRoleRepository } from '@domain/repositories/role.repository.interface';
import { Role } from '@domain/entities/role.entity';
import { Permission } from '@domain/entities/permission.entity';

@injectable()
export class RoleRepository implements IRoleRepository {
  constructor(
    @inject('PrismaClient') private readonly prisma: PrismaClient
  ) {}

  async findById(id: string): Promise<Role | null> {
    const roleData = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!roleData) {
      return null;
    }

    return this.toDomain(roleData);
  }

  async findByName(name: string): Promise<Role | null> {
    const roleData = await this.prisma.role.findUnique({
      where: { name },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!roleData) {
      return null;
    }

    return this.toDomain(roleData);
  }

  async findSystemRoles(): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      where: { isSystem: true },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    return roles.map(role => this.toDomain(role));
  }

  async findNonSystemRoles(): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      where: { isSystem: false },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    return roles.map(role => this.toDomain(role));
  }

  async findWithPermissions(id: string): Promise<Role | null> {
    return this.findById(id);
  }

  async findAll(): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return roles.map(role => this.toDomain(role));
  }

  async create(entity: Role): Promise<Role> {
    const roleData = await this.prisma.role.create({
      data: {
        id: entity.id,
        name: entity.name,
        description: entity.description,
        isSystem: entity.isSystem
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    return this.toDomain(roleData);
  }

  async update(entity: Role): Promise<Role> {
    const roleData = await this.prisma.role.update({
      where: { id: entity.id },
      data: {
        name: entity.name,
        description: entity.description,
        isSystem: entity.isSystem
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    return this.toDomain(roleData);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.role.delete({
      where: { id }
    });
  }

  async exists(name: string): Promise<boolean> {
    const count = await this.prisma.role.count({
      where: { name }
    });

    return count > 0;
  }

  private toDomain(data: any): Role {
    const permissions = data.permissions?.map((rp: any) =>
      Permission.create(
        rp.permission.id,
        rp.permission.resource,
        rp.permission.action,
        rp.permission.description
      )
    ) || [];

    return new Role(
      data.id,
      data.name,
      data.description,
      data.isSystem,
      permissions,
      data.createdAt
    );
  }
}
