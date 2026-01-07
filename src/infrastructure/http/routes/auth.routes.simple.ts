import { Router } from 'express';
import { container } from 'tsyringe';
import { validate } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/authentication.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema
} from '../validation/auth.schemas';
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

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const registerUserHandler = container.resolve(RegisterUserHandler);
    const { email, password, firstName, lastName, roleName } = req.body;

    const command = new RegisterUserCommand(
      email,
      password,
      firstName,
      lastName,
      roleName
    );

    const user = await registerUserHandler.handle(command);

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
  } catch (error) {
    next(error);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const loginHandler = container.resolve(LoginHandler);
    const { email, password } = req.body;

    const command = new LoginCommand(email, password);
    const result = await loginHandler.handle(command);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', validate(refreshTokenSchema), async (req, res, next) => {
  try {
    const refreshTokenHandler = container.resolve(RefreshTokenHandler);
    const { refreshToken } = req.body;

    const command = new RefreshTokenCommand(refreshToken);
    const result = await refreshTokenHandler.handle(command);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Protected routes (require authentication)
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const logoutHandler = container.resolve(LogoutHandler);
    const userId = req.user!.userId;
    const { refreshToken } = req.body;

    const command = new LogoutCommand(userId, refreshToken);
    await logoutHandler.handle(command);

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const getCurrentUserHandler = container.resolve(GetCurrentUserHandler);
    const userId = req.user!.userId;

    const query = new GetCurrentUserQuery(userId);
    const user = await getCurrentUserHandler.handle(query);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

export default router;
