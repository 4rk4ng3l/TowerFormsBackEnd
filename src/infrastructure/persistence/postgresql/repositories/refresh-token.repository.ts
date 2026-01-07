import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { IRefreshTokenRepository } from '@domain/repositories/refresh-token.repository.interface';
import { RefreshToken } from '@domain/entities/refresh-token.entity';

@injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @inject('PrismaClient') private readonly prisma: PrismaClient
  ) {}

  async findById(id: string): Promise<RefreshToken | null> {
    const tokenData = await this.prisma.refreshToken.findUnique({
      where: { id }
    });

    if (!tokenData) {
      return null;
    }

    return this.toDomain(tokenData);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const tokenData = await this.prisma.refreshToken.findUnique({
      where: { token }
    });

    if (!tokenData) {
      return null;
    }

    return this.toDomain(tokenData);
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId }
    });

    return tokens.map(token => this.toDomain(token));
  }

  async findActiveByUserId(userId: string): Promise<RefreshToken[]> {
    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    return tokens.map(token => this.toDomain(token));
  }

  async create(entity: RefreshToken): Promise<RefreshToken> {
    const tokenData = await this.prisma.refreshToken.create({
      data: {
        id: entity.id,
        userId: entity.userId,
        token: entity.token,
        expiresAt: entity.expiresAt,
        revokedAt: entity.revokedAt
      }
    });

    return this.toDomain(tokenData);
  }

  async update(entity: RefreshToken): Promise<RefreshToken> {
    const tokenData = await this.prisma.refreshToken.update({
      where: { id: entity.id },
      data: {
        userId: entity.userId,
        token: entity.token,
        expiresAt: entity.expiresAt,
        revokedAt: entity.revokedAt
      }
    });

    return this.toDomain(tokenData);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.refreshToken.delete({
      where: { id }
    });
  }

  async revokeByToken(token: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { token },
      data: { revokedAt: new Date() }
    });
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null
      },
      data: { revokedAt: new Date() }
    });
  }

  async deleteExpired(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
  }

  async existsByToken(token: string): Promise<boolean> {
    const count = await this.prisma.refreshToken.count({
      where: { token }
    });

    return count > 0;
  }

  private toDomain(data: any): RefreshToken {
    return RefreshToken.create(
      data.id,
      data.userId,
      data.token,
      data.expiresAt
    );
  }
}
