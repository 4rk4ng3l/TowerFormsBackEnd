import { Router } from 'express';
import { container } from 'tsyringe';
import { ExportController } from '../controllers/export.controller';
import { authenticate } from '../middlewares/authentication.middleware';
import { authorize } from '../middlewares/authorization.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/export/submissions/:id/excel - Export submission as Excel
router.get('/submissions/:id/excel', authorize('submissions', 'read'), async (req, res, next) => {
  try {
    const exportController = container.resolve(ExportController);
    await exportController.exportSubmissionExcel(req, res);
  } catch (error) {
    next(error);
  }
});

// GET /api/export/submissions/:id/images/step/:stepNumber - Export step images as ZIP
router.get(
  '/submissions/:id/images/step/:stepNumber',
  authorize('submissions', 'read'),
  async (req, res, next) => {
    try {
      const exportController = container.resolve(ExportController);
      await exportController.exportStepImages(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/export/submissions/:id/package - Export complete package
router.get('/submissions/:id/package', authorize('submissions', 'read'), async (req, res, next) => {
  try {
    const exportController = container.resolve(ExportController);
    await exportController.exportSubmissionPackage(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
