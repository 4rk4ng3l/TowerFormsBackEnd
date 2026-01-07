import { Router } from 'express';
import { container } from 'tsyringe';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/authentication.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema
} from '../validation/auth.schemas';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), (req, res, next) => {
  const authController = container.resolve(AuthController);
  authController.register(req, res).catch(next);
});

router.post('/login', validate(loginSchema), (req, res, next) => {
  const authController = container.resolve(AuthController);
  authController.login(req, res).catch(next);
});

router.post('/refresh', validate(refreshTokenSchema), (req, res, next) => {
  const authController = container.resolve(AuthController);
  authController.refreshToken(req, res).catch(next);
});

// Protected routes (require authentication)
router.post('/logout', authenticate, (req, res, next) => {
  const authController = container.resolve(AuthController);
  authController.logout(req, res).catch(next);
});

router.get('/me', authenticate, (req, res, next) => {
  const authController = container.resolve(AuthController);
  authController.getCurrentUser(req, res).catch(next);
});

export default router;
