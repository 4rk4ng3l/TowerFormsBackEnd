import { injectable } from 'tsyringe';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { SubmissionForExport } from '@application/queries/export/get-submission-for-export.handler';

export interface ExcelExportResult {
  url: string;
  fileName: string;
  filePath: string;
}

@injectable()
export class ExcelGeneratorService {
  private readonly exportsDir: string;
  private readonly baseUrl: string;

  constructor() {
    this.exportsDir = process.env.EXPORTS_DIR || './uploads/exports';
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    // Ensure exports directory exists
    if (!fs.existsSync(this.exportsDir)) {
      fs.mkdirSync(this.exportsDir, { recursive: true });
    }
  }

  async generateSubmissionExcel(data: SubmissionForExport): Promise<ExcelExportResult> {
    const workbook = new ExcelJS.Workbook();

    // Set workbook properties
    workbook.creator = 'TowerForms';
    workbook.created = new Date();

    // Sheet 1: Información General (Metadatos primero)
    await this.createMetadataSheet(workbook, data);

    // Sheet 2: Respuestas por Step
    await this.createAnswersSheet(workbook, data);

    // Generate filename
    const timestamp = Date.now();
    const formattedDate = this.formatDate(data.submission.completedAt || data.submission.createdAt);
    const sanitizedFormName = this.sanitizeFileName(data.form.name);
    const fileName = `Inspeccion_${sanitizedFormName}_${formattedDate}.xlsx`;
    const uniqueFileName = `submission_${data.submission.id}_excel_${timestamp}.xlsx`;
    const filePath = path.join(this.exportsDir, uniqueFileName);

    // Save file
    await workbook.xlsx.writeFile(filePath);

    // Generate URL
    const url = `${this.baseUrl}/api/files/exports/${uniqueFileName}`;

    return {
      url,
      fileName,
      filePath
    };
  }

  private async createMetadataSheet(workbook: ExcelJS.Workbook, data: SubmissionForExport): Promise<void> {
    const sheet = workbook.addWorksheet('Información General');

    // Set column widths
    sheet.columns = [
      { width: 30 },
      { width: 50 }
    ];

    // Title
    const titleRow = sheet.addRow(['INFORMACIÓN GENERAL']);
    titleRow.font = { bold: true, size: 14 };
    titleRow.height = 25;
    sheet.mergeCells('A1:B1');
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    titleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    titleRow.font = { ...titleRow.font, color: { argb: 'FFFFFFFF' } };

    sheet.addRow([]); // Empty row

    // Form Information
    this.addHeaderRow(sheet, 'DATOS DEL FORMULARIO');
    this.addDataRow(sheet, 'Nombre del Formulario:', data.form.name);
    this.addDataRow(sheet, 'Descripción:', data.form.description || 'N/A');
    this.addDataRow(sheet, 'Versión:', data.form.version.toString());

    sheet.addRow([]); // Empty row

    // Submission Information
    this.addHeaderRow(sheet, 'DATOS DE LA INSPECCIÓN');
    this.addDataRow(sheet, 'ID de Inspección:', data.submission.id);
    this.addDataRow(sheet, 'Fecha de Inicio:', this.formatDateTime(data.submission.startedAt));
    this.addDataRow(
      sheet,
      'Fecha de Finalización:',
      data.submission.completedAt ? this.formatDateTime(data.submission.completedAt) : 'No completado'
    );
    this.addDataRow(sheet, 'Estado de Sincronización:', data.submission.synced ? 'Sincronizado' : 'Pendiente');
    if (data.submission.syncedAt) {
      this.addDataRow(sheet, 'Fecha de Sincronización:', this.formatDateTime(data.submission.syncedAt));
    }

    sheet.addRow([]); // Empty row

    // User Information
    this.addHeaderRow(sheet, 'INSPECTOR');
    this.addDataRow(sheet, 'Nombre:', `${data.user.firstName} ${data.user.lastName}`);
    this.addDataRow(sheet, 'Email:', data.user.email);

    sheet.addRow([]); // Empty row

    // Metadata (Contextual Information)
    if (data.submission.metadata && Object.keys(data.submission.metadata).length > 0) {
      this.addHeaderRow(sheet, 'METADATOS CONTEXTUALES');

      // Get metadata schema if available
      const metadataSchema = data.form.metadataSchema || {};

      for (const [key, value] of Object.entries(data.submission.metadata)) {
        const schema = metadataSchema[key];
        const label = schema?.label || this.formatKey(key);
        const formattedValue = this.formatMetadataValue(value, schema?.type);
        this.addDataRow(sheet, label + ':', formattedValue);
      }
    }
  }

  private async createAnswersSheet(workbook: ExcelJS.Workbook, data: SubmissionForExport): Promise<void> {
    const sheet = workbook.addWorksheet('Respuestas por Step');

    // Set column widths
    sheet.columns = [
      { width: 20 }, // Step
      { width: 40 }, // Pregunta
      { width: 15 }, // Tipo
      { width: 40 }, // Respuesta
      { width: 30 }  // Archivos Adjuntos
    ];

    // Header row
    const headerRow = sheet.addRow(['Step', 'Pregunta', 'Tipo', 'Respuesta', 'Archivos Adjuntos']);
    headerRow.font = { bold: true, size: 12 };
    headerRow.height = 20;
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.font = { ...headerRow.font, color: { argb: 'FFFFFFFF' } };

    // Add answers for each step
    for (const step of data.form.steps.sort((a, b) => a.order - b.order)) {
      for (const question of step.questions.sort((a, b) => a.order - b.order)) {
        // Find answer for this question
        const answer = data.answers.find(a => a.questionId === question.id);
        const answerValue = answer ? this.formatAnswerValue(answer.value, question.type) : 'No respondido';

        // Find files for this question
        const questionFiles = data.files.filter(f => f.questionId === question.id);
        const filesText = questionFiles.length > 0
          ? questionFiles.map(f => f.fileName).join(', ')
          : '-';

        // Add row
        const row = sheet.addRow([
          `Step ${step.order}: ${step.name}`,
          question.text,
          this.formatQuestionType(question.type),
          answerValue,
          filesText
        ]);

        row.alignment = { vertical: 'top', wrapText: true };

        // Alternate row colors
        if (sheet.rowCount % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          };
        }
      }
    }

    // Apply borders to all cells
    sheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
  }

  private addHeaderRow(sheet: ExcelJS.Worksheet, title: string): void {
    const row = sheet.addRow([title]);
    row.font = { bold: true, size: 11 };
    row.height = 18;
    sheet.mergeCells(`A${row.number}:B${row.number}`);
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' }
    };
  }

  private addDataRow(sheet: ExcelJS.Worksheet, label: string, value: string): void {
    const row = sheet.addRow([label, value]);
    row.getCell(1).font = { bold: true };
    row.alignment = { vertical: 'middle' };
  }

  private formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  private formatDate(date: Date): string {
    return new Date(date).toISOString().split('T')[0];
  }

  private formatKey(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private formatMetadataValue(value: any, type?: string): string {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    if (type === 'date' && value) {
      try {
        return new Date(value).toLocaleDateString('es-ES');
      } catch {
        return value.toString();
      }
    }
    if (type === 'time' && value) {
      return value.toString();
    }
    return value.toString();
  }

  private formatAnswerValue(value: any, questionType: string): string {
    if (value === null || value === undefined) return 'No respondido';

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (questionType === 'date' && value) {
      try {
        return new Date(value).toLocaleDateString('es-ES');
      } catch {
        return value.toString();
      }
    }

    if (questionType === 'time' && value) {
      return value.toString();
    }

    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return value.toString();
  }

  private formatQuestionType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'text': 'Texto',
      'single_choice': 'Opción única',
      'multiple_choice': 'Opción múltiple',
      'number': 'Número',
      'date': 'Fecha',
      'time': 'Hora',
      'file': 'Archivo'
    };
    return typeMap[type] || type;
  }

  private sanitizeFileName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }
}
