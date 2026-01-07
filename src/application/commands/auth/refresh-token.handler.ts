import { injectable, inject } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import { ICommandHandler } from '@shared/interfaces/command-handler.interface';
import { RefreshTokenCommand } from './refresh-token.command';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { IRefreshTokenRepository } from '@domain/repositories/refresh-token.repository.interface';
import { TokenService } from '@domain/services/token.service';
import { RefreshToken } from '@domain/entities/refresh-token.entity';
import { AuthenticationException } from '@shared/exceptions/authentication.exception';

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
}

@injectable()
export class RefreshTokenHandler implements ICommandHandler<RefreshTokenCommand, RefreshTokenResult> {
  constructor(
    @inject('IUserRepository') private readonly userRepository: IUserRepository,
    @inject('IRefreshTokenRepository') private readonly refreshTokenRepository: IRefreshTokenRepository,
    @inject(TokenService) private readonly tokenService: TokenService
  ) {}

  async handle(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
    // Find refresh token
    const refreshToken = await this.refreshTokenRepository.findByToken(command.refreshToken);

    if (!refreshToken) {
      throw AuthenticationException.refreshTokenInvalid();
    }

    // Check if token is valid
    if (!refreshToken.isValid()) {
      if (refreshToken.isRevoked()) {
        throw AuthenticationException.refreshTokenRevoked();
      }
      throw AuthenticationException.refreshTokenInvalid();
    }

    // Get user
    const user = await this.userRepository.findById(refreshToken.userId);

    if (!user) {
      throw AuthenticationException.userNotFound();
    }

    // Check user status
    if (!user.canLogin()) {
      throw AuthenticationException.userNotActive();
    }

    // Revoke old refresh token (token rotation)
    await this.refreshTokenRepository.revokeByToken(command.refreshToken);

    // Generate new access token
    const accessToken = this.tokenService.generateAccessToken(
      user.id,
      user.email.getValue(),
      user.role.name
    );

    // Generate new refresh token
    const newRefreshTokenValue = this.tokenService.generateRefreshToken();
    const refreshTokenExpiration = this.tokenService.getRefreshTokenExpirationDate();

    const newRefreshToken = RefreshToken.create(
      uuidv4(),
      user.id,
      newRefreshTokenValue,
      refreshTokenExpiration
    );

    // Save new refresh token
    await this.refreshTokenRepository.create(newRefreshToken);

    return {
      accessToken,
      refreshToken: newRefreshTokenValue
    };
  }
}
