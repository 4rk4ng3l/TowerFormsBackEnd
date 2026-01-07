import { injectable, inject } from 'tsyringe';
import { IQueryHandler } from '@shared/interfaces/query-handler.interface';
import { ListRolesQuery } from './list-roles.query';
import { IRoleRepository } from '@domain/repositories/role.repository.interface';

export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Array<{
    id: string;
    resource: string;
    action: string;
    description: string | null;
  }>;
  createdAt: Date;
}

@injectable()
export class ListRolesHandler implements IQueryHandler<ListRolesQuery, RoleWithPermissions[]> {
  constructor(
    @inject('IRoleRepository') private readonly roleRepository: IRoleRepository
  ) {}

  async handle(query: ListRolesQuery): Promise<RoleWithPermissions[]> {
    const roles = await this.roleRepository.findAll();

    return roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions.map(p => ({
        id: p.id,
        resource: p.resource,
        action: p.action,
        description: p.description
      })),
      createdAt: role.createdAt
    }));
  }
}
