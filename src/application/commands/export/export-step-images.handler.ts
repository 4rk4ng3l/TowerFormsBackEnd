import { injectable, inject } from 'tsyringe';
import { ICommandHandler } from '@shared/interfaces/command-handler.interface';
import { ExportStepImagesCommand } from './export-step-images.command';
import { GetSubmissionForExportHandler } from '@application/queries/export/get-submission-for-export.handler';
import { GetSubmissionForExportQuery } from '@application/queries/export/get-submission-for-export.query';
import { ZipGeneratorService } from '@domain/services/zip-generator.service';
import { ValidationException } from '@shared/exceptions/validation.exception';

export interface ExportResult {
  url: string;
  fileName: string;
}

@injectable()
export class ExportStepImagesHandler
  implements ICommandHandler<ExportStepImagesCommand, ExportResult>
{
  constructor(
    @inject(GetSubmissionForExportHandler)
    private readonly getSubmissionForExportHandler: GetSubmissionForExportHandler,
    @inject(ZipGeneratorService)
    private readonly zipGeneratorService: ZipGeneratorService
  ) {}

  async handle(command: ExportStepImagesCommand): Promise<ExportResult> {
    // Get all data needed for export
    const query = new GetSubmissionForExportQuery(command.submissionId);
    const data = await this.getSubmissionForExportHandler.handle(query);

    // Find the step by stepNumber (order)
    const step = data.form.steps.find(s => s.order === command.stepNumber);
    if (!step) {
      throw ValidationException.invalidField(
        'stepNumber',
        `Step ${command.stepNumber} not found in form`
      );
    }

    // Filter files for this step
    const stepFiles = data.files.filter(f => f.stepId === step.id);

    if (stepFiles.length === 0) {
      throw ValidationException.invalidField(
        'stepNumber',
        `No images found for step ${command.stepNumber}`
      );
    }

    // Generate ZIP file
    const result = await this.zipGeneratorService.generateStepImagesZip(
      data.submission,
      data.form,
      step,
      stepFiles
    );

    return result;
  }
}
