import { injectable, inject } from 'tsyringe';
import { ICommandHandler } from '@shared/interfaces/command-handler.interface';
import { ExportSubmissionExcelCommand } from './export-submission-excel.command';
import { GetSubmissionForExportHandler } from '@application/queries/export/get-submission-for-export.handler';
import { GetSubmissionForExportQuery } from '@application/queries/export/get-submission-for-export.query';
import { ExcelGeneratorService } from '@domain/services/excel-generator.service';

export interface ExportResult {
  url: string;
  fileName: string;
}

@injectable()
export class ExportSubmissionExcelHandler
  implements ICommandHandler<ExportSubmissionExcelCommand, ExportResult>
{
  constructor(
    @inject(GetSubmissionForExportHandler)
    private readonly getSubmissionForExportHandler: GetSubmissionForExportHandler,
    @inject(ExcelGeneratorService)
    private readonly excelGeneratorService: ExcelGeneratorService
  ) {}

  async handle(command: ExportSubmissionExcelCommand): Promise<ExportResult> {
    // Get all data needed for export
    const query = new GetSubmissionForExportQuery(command.submissionId);
    const data = await this.getSubmissionForExportHandler.handle(query);

    // Generate Excel file
    const result = await this.excelGeneratorService.generateSubmissionExcel(data);

    return result;
  }
}
