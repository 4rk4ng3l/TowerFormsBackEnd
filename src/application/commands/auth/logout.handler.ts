import { injectable, inject } from 'tsyringe';
import { ICommandHandler } from '@shared/interfaces/command-handler.interface';
import { LogoutCommand } from './logout.command';
import { IRefreshTokenRepository } from '@domain/repositories/refresh-token.repository.interface';

@injectable()
export class LogoutHandler implements ICommandHandler<LogoutCommand, void> {
  constructor(
    @inject('IRefreshTokenRepository') private readonly refreshTokenRepository: IRefreshTokenRepository
  ) {}

  async handle(command: LogoutCommand): Promise<void> {
    // If specific refresh token provided, revoke only that token
    if (command.refreshToken) {
      await this.refreshTokenRepository.revokeByToken(command.refreshToken);
    } else {
      // Otherwise, revoke all tokens for the user
      await this.refreshTokenRepository.revokeAllByUserId(command.userId);
    }
  }
}
