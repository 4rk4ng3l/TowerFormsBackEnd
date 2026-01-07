import { injectable, inject } from 'tsyringe';
import { IQueryHandler } from '@shared/interfaces/query-handler.interface';
import { GetCurrentUserQuery } from './get-current-user.query';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { AuthenticationException } from '@shared/exceptions/authentication.exception';

export interface CurrentUserResult {
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
  lastLoginAt: Date | null;
}

@injectable()
export class GetCurrentUserHandler implements IQueryHandler<GetCurrentUserQuery, CurrentUserResult> {
  constructor(
    @inject('IUserRepository') private readonly userRepository: IUserRepository
  ) {}

  async handle(query: GetCurrentUserQuery): Promise<CurrentUserResult> {
    const user = await this.userRepository.findById(query.userId);

    if (!user) {
      throw AuthenticationException.userNotFound();
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
      lastLoginAt: user.lastLoginAt
    };
  }
}
