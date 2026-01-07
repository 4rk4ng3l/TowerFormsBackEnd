import { Router } from 'express';
import { container } from 'tsyringe';
import { UsersController } from '../controllers/users.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/authentication.middleware';
import { authorize } from '../middlewares/authorization.middleware';
import {
  createUserSchema,
  changeUserPasswordSchema,
  updateUserStatusSchema
} from '../validation/user.schemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/users - List all users (requires users:read permission)
router.get('/', authorize('users', 'read'), async (req, res, next) => {
  try {
    const usersController = container.resolve(UsersController);
    await usersController.list(req, res);
  } catch (error) {
    next(error);
  }
});

// GET /api/users/pending - List pending users (requires users:approve permission)
router.get('/pending', authorize('users', 'approve'), async (req, res, next) => {
  try {
    const usersController = container.resolve(UsersController);
    await usersController.listPending(req, res);
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id - Get user by ID (requires users:read permission)
router.get('/:id', authorize('users', 'read'), async (req, res, next) => {
  try {
    const usersController = container.resolve(UsersController);
    await usersController.getById(req, res);
  } catch (error) {
    next(error);
  }
});

// POST /api/users - Create new user (requires users:create permission)
router.post('/', authorize('users', 'create'), validate(createUserSchema), async (req, res, next) => {
  try {
    const usersController = container.resolve(UsersController);
    await usersController.create(req, res);
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id/approve - Approve user (requires users:approve permission)
router.put('/:id/approve', authorize('users', 'approve'), async (req, res, next) => {
  try {
    const usersController = container.resolve(UsersController);
    await usersController.approve(req, res);
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id/password - Change user password (requires users:change_password permission)
router.put('/:id/password', authorize('users', 'change_password'), validate(changeUserPasswordSchema), async (req, res, next) => {
  try {
    const usersController = container.resolve(UsersController);
    await usersController.changePassword(req, res);
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id/status - Update user status (requires users:update permission)
router.put('/:id/status', authorize('users', 'update'), validate(updateUserStatusSchema), async (req, res, next) => {
  try {
    const usersController = container.resolve(UsersController);
    await usersController.updateStatus(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
