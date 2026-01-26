import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { SyncSubmissionsCommand } from '@application/commands/sync/sync-submissions.command';
import { SyncSubmissionsHandler } from '@application/commands/sync/sync-submissions.handler';
import { GetPendingSyncDataQuery } from '@application/queries/sync/get-pending-sync-data.query';
import { GetPendingSyncDataHandler } from '@application/queries/sync/get-pending-sync-data.handler';

@injectable()
export class SyncController {
  constructor(
    @inject(SyncSubmissionsHandler) private readonly syncSubmissionsHandler: SyncSubmissionsHandler,
    @inject(GetPendingSyncDataHandler) private readonly getPendingSyncDataHandler: GetPendingSyncDataHandler
  ) {}

  async syncFromDevice(req: Request, res: Response): Promise<void> {
    const { submissions } = req.body;

    if (!submissions || !Array.isArray(submissions)) {
      res.status(400).json({
        success: false,
        message: 'submissions array is required'
      });
      return;
    }

    const command = new SyncSubmissionsCommand(submissions);
    const result = await this.syncSubmissionsHandler.handle(command);

    res.status(200).json({
      success: true,
      message: 'Synchronization completed',
      data: {
        syncedSubmissions: result.syncedSubmissions,
        syncedFiles: result.syncedFiles,
        errors: result.errors,
        hasErrors: result.errors.length > 0
      }
    });
  }

  async getPendingData(req: Request, res: Response): Promise<void> {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    const lastSyncDate = typeof req.query.lastSyncDate === 'string' ? req.query.lastSyncDate : undefined;

    const query = new GetPendingSyncDataQuery(
      userId,
      lastSyncDate ? new Date(lastSyncDate) : undefined
    );

    const pendingData = await this.getPendingSyncDataHandler.handle(query);

    res.status(200).json({
      success: true,
      data: {
        submissions: pendingData.submissions,
        files: pendingData.files,
        sites: pendingData.sites,
        inventoryEE: pendingData.inventoryEE,
        inventoryEP: pendingData.inventoryEP,
        count: {
          submissions: pendingData.submissions.length,
          files: pendingData.files.length,
          sites: pendingData.sites.length,
          inventoryEE: pendingData.inventoryEE.length,
          inventoryEP: pendingData.inventoryEP.length
        }
      }
    });
  }

  async getStatus(req: Request, res: Response): Promise<void> {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;

    const query = new GetPendingSyncDataQuery(userId);
    const pendingData = await this.getPendingSyncDataHandler.handle(query);

    res.status(200).json({
      success: true,
      data: {
        pendingSubmissions: pendingData.submissions.length,
        pendingFiles: pendingData.files.length,
        requiresSync: pendingData.submissions.length > 0 || pendingData.files.length > 0,
        lastChecked: new Date()
      }
    });
  }
}
