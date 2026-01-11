import { Role } from '../entities/role.entity';
import { IRepository } from '@shared/interfaces/repository.interface';

export interface IRoleRepository extends IRepository<Role> {
  findAll(): Promise<Role[]>;
  findByName(name: string): Promise<Role | null>;
  findSystemRoles(): Promise<Role[]>;
  findNonSystemRoles(): Promise<Role[]>;
  exists(name: string): Promise<boolean>;
  findWithPermissions(id: string): Promise<Role | null>;
}
