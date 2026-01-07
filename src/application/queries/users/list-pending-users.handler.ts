import { injectable, inject } from 'tsyringe';
import { IQueryHandler } from '@shared/interfaces/query-handler.interface';
import { ListPendingUsersQuery } from './list-pending-users.query';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { UserStatus } from '@domain/value-objects/user-status.vo';

export interface PendingUserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  createdAt: Date;
}

@injectable()
export class ListPendingUsersHandler implements IQueryHandler<ListPendingUsersQuery, PendingUserItem[]> {
  constructor(
    @inject('IUserRepository') private readonly userRepository: IUserRepository
  ) {}

  async handle(query: ListPendingUsersQuery): Promise<PendingUserItem[]> {
    const users = await this.userRepository.findByStatus(UserStatus.PENDING_APPROVAL);

    return users.map(user => ({
      id: user.id,
      email: user.email.getValue(),
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.getFullName(),
      role: user.role.name,
      createdAt: user.createdAt
    }));
  }
}
