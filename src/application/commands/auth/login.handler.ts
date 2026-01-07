import { injectable, inject } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import { ICommandHandler } from '@shared/interfaces/command-handler.interface';
import { LoginCommand } from './login.command';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { IRefreshTokenRepository } from '@domain/repositories/refresh-token.repository.interface';
import { PasswordHashingService } from '@domain/services/password-hashing.service';
import { TokenService } from '@domain/services/token.service';
import { RefreshToken } from '@domain/entities/refresh-token.entity';
import { AuthenticationException } from '@shared/exceptions/authentication.exception';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
  };
}

@injectable()
export class LoginHandler implements ICommandHandler<LoginCommand, LoginResult> {
  constructor(
    @inject('IUserRepository') private readonly userRepository: IUserRepository,
    @inject('IRefreshTokenRepository') private readonly refreshTokenRepository: IRefreshTokenRepository,
    @inject(PasswordHashingService) private readonly passwordHashingService: PasswordHashingService,
    @inject(TokenService) private readonly tokenService: TokenService
  ) {}

  async handle(command: LoginCommand): Promise<LoginResult> {
    // Find user by email
    const user = await this.userRepository.findByEmail(command.email);
    if (!user) {
      throw AuthenticationException.invalidCredentials();
    }

    // Verify password
    const isPasswordValid = await this.passwordHashingService.verify(
      command.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw AuthenticationException.invalidCredentials();
    }

    // Check user status
    if (user.isPending()) {
      throw AuthenticationException.userPendingApproval();
    }

    if (!user.canLogin()) {
      throw AuthenticationException.userNotActive();
    }

    // Generate access token
    const accessToken = this.tokenService.generateAccessToken(
      user.id,
      user.email.getValue(),
      user.role.name
    );

    // Generate refresh token
    const refreshTokenValue = this.tokenService.generateRefreshToken();
    const refreshTokenExpiration = this.tokenService.getRefreshTokenExpirationDate();

    const refreshToken = RefreshToken.create(
      uuidv4(),
      user.id,
      refreshTokenValue,
      refreshTokenExpiration
    );

    // Save refresh token
    await this.refreshTokenRepository.create(refreshToken);

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      user: {
        id: user.id,
        email: user.email.getValue(),
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        status: user.status.getValue()
      }
    };
  }
}
