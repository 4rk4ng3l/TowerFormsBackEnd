import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import { RegisterUserCommand } from '@application/commands/auth/register-user.command';
import { RegisterUserHandler } from '@application/commands/auth/register-user.handler';
import { LoginCommand } from '@application/commands/auth/login.command';
import { LoginHandler } from '@application/commands/auth/login.handler';
import { RefreshTokenCommand } from '@application/commands/auth/refresh-token.command';
import { RefreshTokenHandler } from '@application/commands/auth/refresh-token.handler';
import { LogoutCommand } from '@application/commands/auth/logout.command';
import { LogoutHandler } from '@application/commands/auth/logout.handler';
import { GetCurrentUserQuery } from '@application/queries/auth/get-current-user.query';
import { GetCurrentUserHandler } from '@application/queries/auth/get-current-user.handler';

@injectable()
export class AuthController {
  constructor(
    private readonly registerUserHandler: RegisterUserHandler,
    private readonly loginHandler: LoginHandler,
    private readonly refreshTokenHandler: RefreshTokenHandler,
    private readonly logoutHandler: LogoutHandler,
    private readonly getCurrentUserHandler: GetCurrentUserHandler
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    const { email, password, firstName, lastName, roleName } = req.body;

    const command = new RegisterUserCommand(
      email,
      password,
      firstName,
      lastName,
      roleName
    );

    const user = await this.registerUserHandler.handle(command);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please wait for admin approval.',
      data: {
        id: user.id,
        email: user.email.getValue(),
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status.getValue(),
        role: user.role.name
      }
    });
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    const command = new LoginCommand(email, password);
    const result = await this.loginHandler.handle(command);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;

    const command = new RefreshTokenCommand(refreshToken);
    const result = await this.refreshTokenHandler.handle(command);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  }

  async logout(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { refreshToken } = req.body;

    const command = new LogoutCommand(userId, refreshToken);
    await this.logoutHandler.handle(command);

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  }

  async getCurrentUser(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;

    const query = new GetCurrentUserQuery(userId);
    const user = await this.getCurrentUserHandler.handle(query);

    res.status(200).json({
      success: true,
      data: user
    });
  }
}
