import { BaseException } from './base.exception';

export class AuthorizationException extends BaseException {
  constructor(message: string, code: string = 'AUTHORIZATION_ERROR') {
    super(message, code);
  }

  static insufficientPermissions(resource?: string, action?: string): AuthorizationException {
    const detail = resource && action ? ` to ${action} ${resource}` : '';
    return new AuthorizationException(
      `Insufficient permissions${detail}`,
      'INSUFFICIENT_PERMISSIONS'
    );
  }

  static accessDenied(): AuthorizationException {
    return new AuthorizationException(
      'Access denied',
      'ACCESS_DENIED'
    );
  }

  static cannotAccessResource(resourceType: string, resourceId: string): AuthorizationException {
    return new AuthorizationException(
      `You do not have permission to access this ${resourceType}`,
      'RESOURCE_ACCESS_DENIED'
    );
  }

  static cannotApproveOwnAccount(): AuthorizationException {
    return new AuthorizationException(
      'You cannot approve your own account',
      'CANNOT_APPROVE_OWN_ACCOUNT'
    );
  }

  static cannotModifySystemRole(): AuthorizationException {
    return new AuthorizationException(
      'System roles cannot be modified or deleted',
      'CANNOT_MODIFY_SYSTEM_ROLE'
    );
  }

  static cannotManageSelf(): AuthorizationException {
    return new AuthorizationException(
      'You cannot perform this action on your own account',
      'CANNOT_MANAGE_SELF'
    );
  }

  static roleNotFound(roleName: string): AuthorizationException {
    return new AuthorizationException(
      `Role '${roleName}' not found`,
      'ROLE_NOT_FOUND'
    );
  }

  static permissionNotFound(resource: string, action: string): AuthorizationException {
    return new AuthorizationException(
      `Permission '${resource}:${action}' not found`,
      'PERMISSION_NOT_FOUND'
    );
  }
}
