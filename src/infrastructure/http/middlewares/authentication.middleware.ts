import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { TokenService } from '@domain/services/token.service';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { AuthenticationException } from '@shared/exceptions/authentication.exception';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw AuthenticationException.tokenMissing();
    }

    // Expected format: "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw AuthenticationException.tokenInvalid();
    }

    const token = parts[1];

    // Verify token
    const tokenService = container.resolve(TokenService);
    const payload = tokenService.verifyAccessToken(token);

    // Get user from database
    const userRepository = container.resolve<IUserRepository>('IUserRepository');
    const user = await userRepository.findById(payload.userId);

    if (!user) {
      throw AuthenticationException.userNotFound();
    }

    // Check if user is active
    if (!user.canLogin()) {
      throw AuthenticationException.userNotActive();
    }

    // Attach user info to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    };

    next();
  } catch (error) {
    next(error);
  }
}
