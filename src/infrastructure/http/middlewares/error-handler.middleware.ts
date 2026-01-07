import { Request, Response, NextFunction } from 'express';
import { BaseException } from '@shared/exceptions/base.exception';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { ValidationException } from '@shared/exceptions/validation.exception';
import { SyncException } from '@shared/exceptions/sync.exception';
import { AuthenticationException } from '@shared/exceptions/authentication.exception';
import { AuthorizationException } from '@shared/exceptions/authorization.exception';
import { logger } from '@shared/utils/logger';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Error occurred', error, {
    path: req.path,
    method: req.method,
    body: req.body
  });

  if (error instanceof AuthenticationException) {
    res.status(401).json({
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof AuthorizationException) {
    res.status(403).json({
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof NotFoundException) {
    res.status(404).json({
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof ValidationException) {
    res.status(400).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        errors: error.errors
      }
    });
    return;
  }

  if (error instanceof SyncException) {
    res.status(500).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
    return;
  }

  if (error instanceof BaseException) {
    res.status(500).json({
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message
    }
  });
}
