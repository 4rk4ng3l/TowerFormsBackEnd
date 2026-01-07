import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { User } from '@domain/entities/user.entity';
import { EmailVO } from '@domain/value-objects/email.vo';
import { UserStatusVO, UserStatus } from '@domain/value-objects/user-status.vo';
import { Role } from '@domain/entities/role.entity';
import { Permission } from '@domain/entities/permission.entity';

@injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @inject('PrismaClient') private readonly prisma: PrismaClient
  ) {}

  async findById(id: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!userData) {
      return null;
    }

    return this.toDomain(userData);
  }

  async findByEmail(email: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!userData) {
      return null;
    }

    return this.toDomain(userData);
  }

  async findByStatus(status: UserStatus): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { status },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    return users.map(user => this.toDomain(user));
  }

  async findByRole(roleId: string): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { roleId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    return users.map(user => this.toDomain(user));
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return users.map(user => this.toDomain(user));
  }

  async create(entity: User): Promise<User> {
    const userData = await this.prisma.user.create({
      data: {
        id: entity.id,
        email: entity.email.getValue(),
        passwordHash: entity.passwordHash,
        firstName: entity.firstName,
        lastName: entity.lastName,
        status: entity.status.getValue(),
        roleId: entity.role.id,
        approvedAt: entity.approvedAt,
        approvedBy: entity.approvedBy,
        lastLoginAt: entity.lastLoginAt
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    return this.toDomain(userData);
  }

  async update(entity: User): Promise<User> {
    const userData = await this.prisma.user.update({
      where: { id: entity.id },
      data: {
        email: entity.email.getValue(),
        passwordHash: entity.passwordHash,
        firstName: entity.firstName,
        lastName: entity.lastName,
        status: entity.status.getValue(),
        roleId: entity.role.id,
        approvedAt: entity.approvedAt,
        approvedBy: entity.approvedBy,
        lastLoginAt: entity.lastLoginAt
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    return this.toDomain(userData);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id }
    });
  }

  async approve(id: string, approverId: string): Promise<User> {
    const userData = await this.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.ACTIVE,
        approvedAt: new Date(),
        approvedBy: approverId
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    return this.toDomain(userData);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash }
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() }
    });
  }

  async updateStatus(id: string, status: UserStatus): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { status }
    });
  }

  async exists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email: email.toLowerCase() }
    });

    return count > 0;
  }

  private toDomain(data: any): User {
    const permissions = data.role.permissions.map((rp: any) =>
      Permission.create(
        rp.permission.id,
        rp.permission.resource,
        rp.permission.action,
        rp.permission.description
      )
    );

    const role = new Role(
      data.role.id,
      data.role.name,
      data.role.description,
      data.role.isSystem,
      permissions,
      data.role.createdAt
    );

    return new User(
      data.id,
      EmailVO.fromString(data.email),
      data.passwordHash,
      data.firstName,
      data.lastName,
      UserStatusVO.fromString(data.status),
      role,
      data.createdAt,
      data.updatedAt,
      data.approvedAt,
      data.approvedBy,
      data.lastLoginAt
    );
  }
}
