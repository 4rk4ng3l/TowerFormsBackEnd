import { Router } from 'express';
import { container } from 'tsyringe';
import { SyncController } from '../controllers/sync.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/authentication.middleware';
import { authorize } from '../middlewares/authorization.middleware';
import { syncSubmissionsSchema, getPendingSyncDataSchema } from '../validation/sync.schemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/sync - Sync submissions and files from device to server
// Body: { submissions: [{ id, formId, userId, metadata, answers, files }] }
router.post(
  '/',
  authorize('sync', 'write'),
  validate(syncSubmissionsSchema),
  async (req, res, next) => {
    try {
      const syncController = container.resolve(SyncController);
      await syncController.syncFromDevice(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/sync/pending - Get pending data to sync from server to device
// Query params: ?userId=xxx&lastSyncDate=2024-01-01T00:00:00Z
router.get(
  '/pending',
  authorize('sync', 'read'),
  validate(getPendingSyncDataSchema, 'query'),
  async (req, res, next) => {
    try {
      const syncController = container.resolve(SyncController);
      await syncController.getPendingData(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/sync/status - Get sync status (how many items pending)
// Query params: ?userId=xxx
router.get(
  '/status',
  authorize('sync', 'read'),
  async (req, res, next) => {
    try {
      const syncController = container.resolve(SyncController);
      await syncController.getStatus(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
