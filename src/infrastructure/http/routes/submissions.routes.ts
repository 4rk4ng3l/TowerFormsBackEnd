import { Router } from 'express';
import { container } from 'tsyringe';
import { SubmissionsController } from '../controllers/submissions.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/authentication.middleware';
import { authorize } from '../middlewares/authorization.middleware';
import {
  createSubmissionSchema,
  updateSubmissionSchema,
  listSubmissionsSchema
} from '../validation/submission.schemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/submissions - List submissions (requires submissions:read permission)
// Supports query params: ?formId=xxx or ?userId=xxx
router.get('/', authorize('submissions', 'read'), validate(listSubmissionsSchema, 'query'), async (req, res, next) => {
  try {
    const submissionsController = container.resolve(SubmissionsController);
    await submissionsController.list(req, res);
  } catch (error) {
    next(error);
  }
});

// GET /api/submissions/:id - Get submission by ID (requires submissions:read permission)
router.get('/:id', authorize('submissions', 'read'), async (req, res, next) => {
  try {
    const submissionsController = container.resolve(SubmissionsController);
    await submissionsController.getById(req, res);
  } catch (error) {
    next(error);
  }
});

// POST /api/submissions - Create new submission (requires submissions:create permission)
router.post('/', authorize('submissions', 'create'), validate(createSubmissionSchema), async (req, res, next) => {
  try {
    const submissionsController = container.resolve(SubmissionsController);
    await submissionsController.create(req, res);
  } catch (error) {
    next(error);
  }
});

// PUT /api/submissions/:id - Update submission (add answers) (requires submissions:update permission)
router.put('/:id', authorize('submissions', 'update'), validate(updateSubmissionSchema), async (req, res, next) => {
  try {
    const submissionsController = container.resolve(SubmissionsController);
    await submissionsController.update(req, res);
  } catch (error) {
    next(error);
  }
});

// PUT /api/submissions/:id/complete - Mark submission as completed (requires submissions:update permission)
router.put('/:id/complete', authorize('submissions', 'update'), async (req, res, next) => {
  try {
    const submissionsController = container.resolve(SubmissionsController);
    await submissionsController.complete(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
