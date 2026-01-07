import { injectable, inject } from 'tsyringe';
import { IQueryHandler } from '@shared/interfaces/query-handler.interface';
import { GetUserQuery } from './get-user.query';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { NotFoundException } from '@shared/exceptions/not-found.exception';

export interface UserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: {
    id: string;
    name: string;
    permissions: Array<{
      id: string;
      resource: string;
      action: string;
    }>;
  };
  status: string;
  createdAt: Date;
  updatedAt: Date;
  approvedAt: Date | null;
  approvedBy: string | null;
  lastLoginAt: Date | null;
}

@injectable()
export class GetUserHandler implements IQueryHandler<GetUserQuery, UserDetail> {
  constructor(
    @inject('IUserRepository') private readonly userRepository: IUserRepository
  ) {}

  async handle(query: GetUserQuery): Promise<UserDetail> {
    const user = await this.userRepository.findById(query.userId);

    if (!user) {
      throw NotFoundException.form(`User with id '${query.userId}' not found`);
    }

    return {
      id: user.id,
      email: user.email.getValue(),
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.getFullName(),
      role: {
        id: user.role.id,
        name: user.role.name,
        permissions: user.role.permissions.map(p => ({
          id: p.id,
          resource: p.resource,
          action: p.action
        }))
      },
      status: user.status.getValue(),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      approvedAt: user.approvedAt,
      approvedBy: user.approvedBy,
      lastLoginAt: user.lastLoginAt
    };
  }
}
