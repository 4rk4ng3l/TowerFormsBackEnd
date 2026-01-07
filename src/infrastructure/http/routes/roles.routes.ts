import { Router } from 'express';
import { container } from 'tsyringe';
import { RolesController } from '../controllers/roles.controller';
import { authenticate } from '../middlewares/authentication.middleware';
import { authorize } from '../middlewares/authorization.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/roles - List all roles with permissions (requires roles:read permission)
router.get('/', authorize('roles', 'read'), async (req, res, next) => {
  try {
    const rolesController = container.resolve(RolesController);
    await rolesController.list(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
