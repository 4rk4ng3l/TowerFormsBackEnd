import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { AuthorizationService } from '@domain/services/authorization.service';
import { AuthorizationException } from '@shared/exceptions/authorization.exception';
import { AuthenticationException } from '@shared/exceptions/authentication.exception';

export function authorize(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Ensure user is authenticated (should be set by authenticate middleware)
      if (!req.user) {
        throw AuthenticationException.tokenMissing();
      }

      const authorizationService = container.resolve(AuthorizationService);

      // Check if user has permission
      const hasPermission = await authorizationService.hasPermission(
        req.user.userId,
        resource,
        action
      );

      if (!hasPermission) {
        throw AuthorizationException.insufficientPermissions(resource, action);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
