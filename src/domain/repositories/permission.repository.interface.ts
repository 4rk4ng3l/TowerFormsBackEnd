import { Permission } from '../entities/permission.entity';
import { IRepository } from '@shared/interfaces/repository.interface';

export interface IPermissionRepository extends IRepository<Permission> {
  findByResource(resource: string): Promise<Permission[]>;
  findByAction(action: string): Promise<Permission[]>;
  findByResourceAction(resource: string, action: string): Promise<Permission | null>;
  findByRoleId(roleId: string): Promise<Permission[]>;
  exists(resource: string, action: string): Promise<boolean>;
}
