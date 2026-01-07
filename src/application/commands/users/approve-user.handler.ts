import { injectable, inject } from 'tsyringe';
import { ICommandHandler } from '@shared/interfaces/command-handler.interface';
import { ApproveUserCommand } from './approve-user.command';
import { User } from '@domain/entities/user.entity';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { AuthorizationException } from '@shared/exceptions/authorization.exception';

@injectable()
export class ApproveUserHandler implements ICommandHandler<ApproveUserCommand, User> {
  constructor(
    @inject('IUserRepository') private readonly userRepository: IUserRepository
  ) {}

  async handle(command: ApproveUserCommand): Promise<User> {
    // Find user to approve
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw NotFoundException.form(`User with id '${command.userId}' not found`);
    }

    // Business rule: User cannot approve themselves
    if (user.id === command.approverId) {
      throw AuthorizationException.cannotApproveOwnAccount();
    }

    // Business rule: User must be in pending status
    if (!user.isPending()) {
      throw new Error(`User is not in pending approval status. Current status: ${user.status.getValue()}`);
    }

    // Approve user
    const approvedUser = user.approve(command.approverId);

    // Save to database
    const updatedUser = await this.userRepository.update(approvedUser);

    return updatedUser;
  }
}
