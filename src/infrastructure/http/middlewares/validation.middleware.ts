import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ValidationException } from '@shared/exceptions/validation.exception';

type ValidationSource = 'body' | 'query' | 'params';

export function validate(schema: z.ZodSchema, source: ValidationSource = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = source === 'query' ? req.query : source === 'params' ? req.params : req.body;
      schema.parse(data);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        });

        next(ValidationException.fromErrors(errors));
      } else {
        next(error);
      }
    }
  };
}
