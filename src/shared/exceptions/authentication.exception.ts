import { BaseException } from './base.exception';

export class AuthenticationException extends BaseException {
  constructor(message: string, code: string = 'AUTH_ERROR') {
    super(message, code);
  }

  static invalidCredentials(): AuthenticationException {
    return new AuthenticationException(
      'Invalid email or password',
      'INVALID_CREDENTIALS'
    );
  }

  static userNotFound(): AuthenticationException {
    return new AuthenticationException(
      'User not found',
      'USER_NOT_FOUND'
    );
  }

  static userNotActive(): AuthenticationException {
    return new AuthenticationException(
      'User account is not active. Please contact an administrator.',
      'USER_NOT_ACTIVE'
    );
  }

  static userPendingApproval(): AuthenticationException {
    return new AuthenticationException(
      'User account is pending approval. Please wait for an administrator to approve your account.',
      'USER_PENDING_APPROVAL'
    );
  }

  static tokenExpired(): AuthenticationException {
    return new AuthenticationException(
      'Authentication token has expired',
      'TOKEN_EXPIRED'
    );
  }

  static tokenInvalid(): AuthenticationException {
    return new AuthenticationException(
      'Invalid authentication token',
      'TOKEN_INVALID'
    );
  }

  static tokenMissing(): AuthenticationException {
    return new AuthenticationException(
      'Authentication token is missing',
      'TOKEN_MISSING'
    );
  }

  static refreshTokenInvalid(): AuthenticationException {
    return new AuthenticationException(
      'Invalid or expired refresh token',
      'REFRESH_TOKEN_INVALID'
    );
  }

  static refreshTokenRevoked(): AuthenticationException {
    return new AuthenticationException(
      'Refresh token has been revoked',
      'REFRESH_TOKEN_REVOKED'
    );
  }

  static emailAlreadyExists(): AuthenticationException {
    return new AuthenticationException(
      'Email address is already registered',
      'EMAIL_ALREADY_EXISTS'
    );
  }
}
