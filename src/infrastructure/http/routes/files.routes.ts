import { Router, Request, Response, NextFunction } from 'express';
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
  async (req: Request, res: Response, next: NextFunction) => {
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

// GET /api/files/exports/:filename - Serve exported files (no auth required, files expire)
router.get('/exports/:filename', async (req, res, next) => {
  try {
    const path = require('path');
    const fs = require('fs');
    const exportsDir = process.env.EXPORTS_DIR || './uploads/exports';
    const filePath = path.join(exportsDir, req.params.filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'Export file not found or expired'
        }
      });
      return;
    }

    // Send file
    res.download(filePath);
  } catch (error) {
    next(error);
  }
});

export default router;
