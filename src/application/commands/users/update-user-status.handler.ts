import { injectable, inject } from 'tsyringe';
import { ICommandHandler } from '@shared/interfaces/command-handler.interface';
import { UpdateUserStatusCommand } from './update-user-status.command';
import { User } from '@domain/entities/user.entity';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { NotFoundException } from '@shared/exceptions/not-found.exception';

@injectable()
export class UpdateUserStatusHandler implements ICommandHandler<UpdateUserStatusCommand, User> {
  constructor(
    @inject('IUserRepository') private readonly userRepository: IUserRepository
  ) {}

  async handle(command: UpdateUserStatusCommand): Promise<User> {
    // Find user
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw NotFoundException.form(`User with id '${command.userId}' not found`);
    }

    // Update status
    let updatedUser: User;
    if (command.status === 'ACTIVE') {
      updatedUser = user.activate();
    } else {
      updatedUser = user.deactivate();
    }

    // Save to database
    const savedUser = await this.userRepository.update(updatedUser);

    return savedUser;
  }
}
