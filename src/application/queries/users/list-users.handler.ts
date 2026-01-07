import { injectable, inject } from 'tsyringe';
import { IQueryHandler } from '@shared/interfaces/query-handler.interface';
import { ListUsersQuery } from './list-users.query';
import { IUserRepository } from '@domain/repositories/user.repository.interface';

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  status: string;
  createdAt: Date;
  lastLoginAt: Date | null;
}

@injectable()
export class ListUsersHandler implements IQueryHandler<ListUsersQuery, UserListItem[]> {
  constructor(
    @inject('IUserRepository') private readonly userRepository: IUserRepository
  ) {}

  async handle(query: ListUsersQuery): Promise<UserListItem[]> {
    const users = await this.userRepository.findAll();

    return users.map(user => ({
      id: user.id,
      email: user.email.getValue(),
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.getFullName(),
      role: user.role.name,
      status: user.status.getValue(),
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    }));
  }
}
