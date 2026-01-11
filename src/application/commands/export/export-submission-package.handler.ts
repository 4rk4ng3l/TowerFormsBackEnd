import { injectable, inject } from 'tsyringe';
import { ICommandHandler } from '@shared/interfaces/command-handler.interface';
import { ExportSubmissionPackageCommand } from './export-submission-package.command';
import { GetSubmissionForExportHandler } from '@application/queries/export/get-submission-for-export.handler';
import { GetSubmissionForExportQuery } from '@application/queries/export/get-submission-for-export.query';
import { ExcelGeneratorService } from '@domain/services/excel-generator.service';
import { ZipGeneratorService } from '@domain/services/zip-generator.service';

export interface StepImageExport {
  stepNumber: number;
  url: string;
  fileName: string;
}

export interface PackageExportResult {
  excel: {
    url: string;
    fileName: string;
  };
  images: StepImageExport[];
}

@injectable()
export class ExportSubmissionPackageHandler
  implements ICommandHandler<ExportSubmissionPackageCommand, PackageExportResult>
{
  constructor(
    @inject(GetSubmissionForExportHandler)
    private readonly getSubmissionForExportHandler: GetSubmissionForExportHandler,
    @inject(ExcelGeneratorService)
    private readonly excelGeneratorService: ExcelGeneratorService,
    @inject(ZipGeneratorService)
    private readonly zipGeneratorService: ZipGeneratorService
  ) {}

  async handle(command: ExportSubmissionPackageCommand): Promise<PackageExportResult> {
    // Get all data needed for export
    const query = new GetSubmissionForExportQuery(command.submissionId);
    const data = await this.getSubmissionForExportHandler.handle(query);

    // Generate Excel file
    const excel = await this.excelGeneratorService.generateSubmissionExcel(data);

    // Generate ZIP files for each step that has images
    const images: StepImageExport[] = [];

    for (const step of data.form.steps) {
      const stepFiles = data.files.filter(f => f.stepId === step.id);

      if (stepFiles.length > 0) {
        const zipResult = await this.zipGeneratorService.generateStepImagesZip(
          data.submission,
          data.form,
          step,
          stepFiles
        );

        images.push({
          stepNumber: step.order,
          url: zipResult.url,
          fileName: zipResult.fileName
        });
      }
    }

    return {
      excel,
      images
    };
  }
}
