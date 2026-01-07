import { Router } from 'express';
import { container } from 'tsyringe';
import { FilesController } from '../controllers/files.controller';
import { authenticate } from '../middlewares/authentication.middleware';
import { authorize } from '../middlewares/authorization.middleware';
import { uploadSingleFile, handleUploadError } from '../middlewares/upload.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/files/upload - Upload a file (requires files:create permission)
router.post(
  '/upload',
  authorize('files', 'create'),
  uploadSingleFile,
  handleUploadError,
  async (req, res, next) => {
    try {
      const filesController = container.resolve(FilesController);
      await filesController.uploadFile(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/files/:id - Get file metadata (requires files:read permission)
router.get('/:id', authorize('files', 'read'), async (req, res, next) => {
  try {
    const filesController = container.resolve(FilesController);
    await filesController.getFileInfo(req, res);
  } catch (error) {
    next(error);
  }
});

// GET /api/files/:id/download - Download file (requires files:read permission)
router.get('/:id/download', authorize('files', 'read'), async (req, res, next) => {
  try {
    const filesController = container.resolve(FilesController);
    await filesController.downloadFile(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
