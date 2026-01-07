import { injectable, inject } from 'tsyringe';
import { ICommandHandler } from '@shared/interfaces/command-handler.interface';
import { ChangeUserPasswordCommand } from './change-user-password.command';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { PasswordHashingService } from '@domain/services/password-hashing.service';
import { PasswordVO } from '@domain/value-objects/password.vo';
import { NotFoundException } from '@shared/exceptions/not-found.exception';

@injectable()
export class ChangeUserPasswordHandler implements ICommandHandler<ChangeUserPasswordCommand, void> {
  constructor(
    @inject('IUserRepository') private readonly userRepository: IUserRepository,
    @inject(PasswordHashingService) private readonly passwordHashingService: PasswordHashingService
  ) {}

  async handle(command: ChangeUserPasswordCommand): Promise<void> {
    // Find user
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw NotFoundException.form(`User with id '${command.userId}' not found`);
    }

    // Validate new password
    PasswordVO.fromPlainText(command.newPassword);

    // Hash new password
    const newPasswordHash = await this.passwordHashingService.hash(command.newPassword);

    // Update password in database
    await this.userRepository.updatePassword(command.userId, newPasswordHash);
  }
}
