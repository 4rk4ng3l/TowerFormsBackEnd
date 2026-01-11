import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { ExportSubmissionExcelHandler } from '@application/commands/export/export-submission-excel.handler';
import { ExportSubmissionExcelCommand } from '@application/commands/export/export-submission-excel.command';
import { ExportStepImagesHandler } from '@application/commands/export/export-step-images.handler';
import { ExportStepImagesCommand } from '@application/commands/export/export-step-images.command';
import { ExportSubmissionPackageHandler } from '@application/commands/export/export-submission-package.handler';
import { ExportSubmissionPackageCommand } from '@application/commands/export/export-submission-package.command';

@injectable()
export class ExportController {
  constructor(
    @inject(ExportSubmissionExcelHandler)
    private readonly exportExcelHandler: ExportSubmissionExcelHandler,
    @inject(ExportStepImagesHandler)
    private readonly exportStepImagesHandler: ExportStepImagesHandler,
    @inject(ExportSubmissionPackageHandler)
    private readonly exportPackageHandler: ExportSubmissionPackageHandler
  ) {}

  /**
   * GET /api/export/submissions/:id/excel
   * Export submission as Excel file
   */
  async exportSubmissionExcel(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const command = new ExportSubmissionExcelCommand(id);
      const result = await this.exportExcelHandler.handle(command);

      res.status(200).json({
        success: true,
        data: {
          url: result.url,
          fileName: result.fileName
        }
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'EXPORT_FAILED',
          message: error.message || 'Failed to export submission as Excel'
        }
      });
    }
  }

  /**
   * GET /api/export/submissions/:id/images/step/:stepNumber
   * Export images of a specific step as ZIP file
   */
  async exportStepImages(req: Request, res: Response): Promise<void> {
    try {
      const { id, stepNumber } = req.params;
      const stepNum = parseInt(stepNumber, 10);

      if (isNaN(stepNum) || stepNum < 1) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STEP_NUMBER',
            message: 'Step number must be a positive integer'
          }
        });
        return;
      }

      const command = new ExportStepImagesCommand(id, stepNum);
      const result = await this.exportStepImagesHandler.handle(command);

      res.status(200).json({
        success: true,
        data: {
          url: result.url,
          fileName: result.fileName
        }
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'EXPORT_FAILED',
          message: error.message || 'Failed to export step images'
        }
      });
    }
  }

  /**
   * GET /api/export/submissions/:id/package
   * Export complete package (Excel + ZIP files for each step with images)
   */
  async exportSubmissionPackage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const command = new ExportSubmissionPackageCommand(id);
      const result = await this.exportPackageHandler.handle(command);

      res.status(200).json({
        success: true,
        data: {
          excel: result.excel,
          images: result.images
        }
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'EXPORT_FAILED',
          message: error.message || 'Failed to export submission package'
        }
      });
    }
  }
}
