import { User } from '../entities/user.entity';
import { UserStatus } from '../value-objects/user-status.vo';
import { IRepository } from '@shared/interfaces/repository.interface';

export interface IUserRepository extends IRepository<User> {
  findAll(): Promise<User[]>;
  findByEmail(email: string): Promise<User | null>;
  findByStatus(status: UserStatus): Promise<User[]>;
  findByRole(roleId: string): Promise<User[]>;
  approve(id: string, approverId: string): Promise<User>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  updateLastLogin(id: string): Promise<void>;
  updateStatus(id: string, status: UserStatus): Promise<void>;
  exists(email: string): Promise<boolean>;
}
