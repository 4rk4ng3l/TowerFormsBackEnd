import { RefreshToken } from '../entities/refresh-token.entity';
import { IRepository } from '@shared/interfaces/repository.interface';

export interface IRefreshTokenRepository extends IRepository<RefreshToken> {
  findByToken(token: string): Promise<RefreshToken | null>;
  findByUserId(userId: string): Promise<RefreshToken[]>;
  findActiveByUserId(userId: string): Promise<RefreshToken[]>;
  revokeByToken(token: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<void>;
  existsByToken(token: string): Promise<boolean>;
}
