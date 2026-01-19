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

    // Create main sheet following original format
    await this.createMainSheet(workbook, data);

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

  private async createMainSheet(workbook: ExcelJS.Workbook, data: SubmissionForExport): Promise<void> {
    const sheet = workbook.addWorksheet('Rutina Mantenimiento');

    // Set column widths (9 columns like original)
    sheet.columns = [
      { width: 18 },  // A - Actividad
      { width: 25 },  // B - Descripcion
      { width: 35 },  // C - Definicion
      { width: 20 },  // D - Clasificacion
      { width: 15 },  // E - Periodicidad
      { width: 20 },  // F - Observaciones (start)
      { width: 20 },  // G - Observaciones (cont)
      { width: 20 },  // H - Observaciones (cont)
      { width: 20 },  // I - Observaciones (end)
    ];

    let currentRow = 1;

    // ============================================
    // SECTION 1: HEADER - Title (6 rows merged)
    // ============================================
    const titleText = `RUTINA MANTENIMIENTO PREVENTIVO - ${data.form.name.toUpperCase()}`;

    for (let i = 0; i < 6; i++) {
      const row = sheet.getRow(currentRow + i);
      row.getCell(1).value = titleText;
      row.height = 20;
    }

    sheet.mergeCells(`A1:I6`);
    const titleCell = sheet.getCell('A1');
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };

    currentRow = 7;

    // Empty row
    currentRow++;

    // ============================================
    // SECTION 2: METADATA - Site Information
    // ============================================

    // Row with labels: CÓDIGO DEL SITIO, NOMBRE SITIO, LATITUD, LONGITUD, DIRECCION, REGIONAL
    const metaLabels1 = sheet.getRow(currentRow);
    metaLabels1.values = ['CÓDIGO DEL SITIO', 'NOMBRE SITIO', 'NOMBRE SITIO', 'LATITUD', 'LONGITUD', 'DIRECCION', 'DIRECCION', 'DIRECCION', 'REGIONAL'];
    this.styleHeaderRow(metaLabels1);
    sheet.mergeCells(`B${currentRow}:C${currentRow}`);
    sheet.mergeCells(`F${currentRow}:H${currentRow}`);
    currentRow++;

    // Row with values from metadata
    const metadata = data.submission.metadata || {};
    const metaValues1 = sheet.getRow(currentRow);
    metaValues1.values = [
      metadata.codigoSitio || metadata.siteCode || 'N/A',
      metadata.nombreSitio || metadata.siteName || 'N/A',
      metadata.nombreSitio || metadata.siteName || '',
      metadata.latitud || metadata.latitude || 'N/A',
      metadata.longitud || metadata.longitude || 'N/A',
      metadata.direccion || metadata.address || 'N/A',
      metadata.direccion || metadata.address || '',
      metadata.direccion || metadata.address || '',
      metadata.regional || metadata.region || 'N/A'
    ];
    this.styleDataRow(metaValues1);
    sheet.mergeCells(`B${currentRow}:C${currentRow}`);
    sheet.mergeCells(`F${currentRow}:H${currentRow}`);
    currentRow++;

    // Empty row
    currentRow++;

    // Row with labels: TIPO DE SITIO, EMPRESA, COORDINADOR CONTRATISTA, FECHA DE EJECUCION, NUMERO DE TK
    const metaLabels2 = sheet.getRow(currentRow);
    metaLabels2.values = ['TIPO DE SITIO', 'EMPRESA', 'COORDINADOR CONTRATISTA', 'COORDINADOR CONTRATISTA', 'FECHA DE EJECUCION', 'FECHA DE EJECUCION', 'NUMERO DE TK', 'NUMERO DE TK', ''];
    this.styleHeaderRow(metaLabels2);
    sheet.mergeCells(`C${currentRow}:D${currentRow}`);
    sheet.mergeCells(`E${currentRow}:F${currentRow}`);
    sheet.mergeCells(`G${currentRow}:H${currentRow}`);
    currentRow++;

    // Row with values
    const metaValues2 = sheet.getRow(currentRow);
    metaValues2.values = [
      metadata.tipoSitio || metadata.siteType || 'N/A',
      metadata.empresa || metadata.company || 'IENERCOM',
      metadata.coordinador || metadata.coordinator || `${data.user.firstName} ${data.user.lastName}`,
      '',
      this.formatDateTime(data.submission.completedAt || data.submission.startedAt),
      '',
      metadata.numeroTK || metadata.ticketNumber || 'N/A',
      '',
      ''
    ];
    this.styleDataRow(metaValues2);
    sheet.mergeCells(`C${currentRow}:D${currentRow}`);
    sheet.mergeCells(`E${currentRow}:F${currentRow}`);
    sheet.mergeCells(`G${currentRow}:H${currentRow}`);
    currentRow++;

    // Empty row
    currentRow++;

    // ============================================
    // SECTION 3: OBSERVACIONES GENERALES
    // ============================================
    const obsHeaderRow = sheet.getRow(currentRow);
    obsHeaderRow.values = ['OBSERVACIONES GENERALES', '', '', '', '', '', '', '', ''];
    this.styleHeaderRow(obsHeaderRow);
    sheet.mergeCells(`A${currentRow}:I${currentRow}`);
    currentRow++;

    // Observaciones content (10 empty rows for notes)
    const generalObs = metadata.observacionesGenerales || metadata.generalObservations || '';
    const obsContentRow = sheet.getRow(currentRow);
    obsContentRow.values = [generalObs, '', '', '', '', '', '', '', ''];
    obsContentRow.height = 60;
    sheet.mergeCells(`A${currentRow}:I${currentRow + 9}`);
    const obsCell = sheet.getCell(`A${currentRow}`);
    obsCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    obsCell.border = this.getThinBorder();
    currentRow += 10;

    // Empty row
    currentRow++;

    // ============================================
    // SECTION 4: CHECKLIST DE ACTIVIDADES
    // ============================================

    // Header row for checklist
    const checklistHeader = sheet.getRow(currentRow);
    checklistHeader.values = ['Actividad', 'Descripción', 'DEFINICION', 'CLASIFICACIÓN HALLAZGO', 'PERIODICIDAD', 'OBSERVACIONES', '', '', ''];
    this.styleHeaderRow(checklistHeader);
    checklistHeader.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    checklistHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    sheet.mergeCells(`F${currentRow}:I${currentRow}`);
    currentRow++;

    // Add answers grouped by step (Actividad)
    for (const step of data.form.steps.sort((a, b) => a.order - b.order)) {
      for (const question of step.questions.sort((a, b) => a.order - b.order)) {
        // Find answer for this question
        const answer = data.answers.find(a => a.questionId === question.id);
        const answerValue = answer ? this.formatClassification(answer.value, question.type) : 'No respondido';
        const answerComment = answer?.comment || '';

        // Find files for this question
        const questionFiles = data.files.filter(f => f.questionId === question.id);
        const filesNote = questionFiles.length > 0
          ? ` [${questionFiles.length} archivo(s) adjunto(s)]`
          : '';

        // Get question metadata for periodicidad
        const questionMeta = question.options ? JSON.parse(JSON.stringify(question.options)) : null;
        const periodicidad = this.getPeriodicidad(question);

        const row = sheet.getRow(currentRow);
        row.values = [
          step.name,                              // Actividad (Step name)
          question.text,                          // Descripción
          this.getDefinicion(question),           // Definición
          answerValue,                            // Clasificación Hallazgo
          periodicidad,                           // Periodicidad
          answerComment + filesNote,              // Observaciones
          '',
          '',
          ''
        ];

        row.alignment = { vertical: 'top', wrapText: true };
        row.height = Math.max(25, Math.ceil((answerComment.length + filesNote.length) / 40) * 15);

        // Merge observation columns
        sheet.mergeCells(`F${currentRow}:I${currentRow}`);

        // Apply borders
        for (let col = 1; col <= 9; col++) {
          row.getCell(col).border = this.getThinBorder();
        }

        // Alternate row colors
        if (currentRow % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          };
        }

        // Color code classification
        const classCell = row.getCell(4);
        this.applyClassificationColor(classCell, answerValue);

        currentRow++;
      }
    }

    // ============================================
    // SECTION 5: FOOTER - Inspector Info
    // ============================================
    currentRow++;
    const footerRow = sheet.getRow(currentRow);
    footerRow.values = [
      'INSPECTOR:',
      `${data.user.firstName} ${data.user.lastName}`,
      '',
      'EMAIL:',
      data.user.email,
      '',
      'FECHA EXPORTACIÓN:',
      this.formatDateTime(new Date()),
      ''
    ];
    footerRow.font = { italic: true, size: 10 };
    sheet.mergeCells(`B${currentRow}:C${currentRow}`);
    sheet.mergeCells(`E${currentRow}:F${currentRow}`);
    sheet.mergeCells(`H${currentRow}:I${currentRow}`);
  }

  private styleHeaderRow(row: ExcelJS.Row): void {
    row.font = { bold: true, size: 10 };
    row.height = 20;
    row.alignment = { vertical: 'middle', horizontal: 'center' };
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' }
    };
    row.eachCell((cell) => {
      cell.border = this.getThinBorder();
    });
  }

  private styleDataRow(row: ExcelJS.Row): void {
    row.font = { size: 10 };
    row.height = 18;
    row.alignment = { vertical: 'middle', horizontal: 'left' };
    row.eachCell((cell) => {
      cell.border = this.getThinBorder();
    });
  }

  private getThinBorder(): Partial<ExcelJS.Borders> {
    return {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  }

  private formatClassification(value: any, questionType: string): string {
    if (value === null || value === undefined) return 'No respondido';

    // Map common values to classification format
    const valueStr = String(value).toLowerCase();

    if (valueStr === 'ok' || valueStr === 'si' || valueStr === 'sí' || valueStr === 'true' || valueStr === 'bueno' || valueStr === 'ok-sin incidencia') {
      return 'OK-Sin Incidencia';
    }
    if (valueStr === 'nok' || valueStr === 'no' || valueStr === 'false' || valueStr === 'malo' || valueStr.includes('nok')) {
      if (valueStr.includes('grave') || valueStr.includes('critico')) {
        return 'NOK-Grave';
      }
      return 'NOK-Leve';
    }
    if (valueStr === 'na' || valueStr === 'n/a' || valueStr === 'no aplica') {
      return 'NA';
    }

    // For arrays (multiple choice)
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return String(value);
  }

  private applyClassificationColor(cell: ExcelJS.Cell, value: string): void {
    const valueUpper = value.toUpperCase();

    if (valueUpper.includes('OK-SIN INCIDENCIA') || valueUpper === 'OK') {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFC6EFCE' } // Green
      };
      cell.font = { color: { argb: 'FF006100' } };
    } else if (valueUpper.includes('NOK-GRAVE')) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFC7CE' } // Red
      };
      cell.font = { color: { argb: 'FF9C0006' } };
    } else if (valueUpper.includes('NOK-LEVE')) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFEB9C' } // Yellow
      };
      cell.font = { color: { argb: 'FF9C5700' } };
    } else if (valueUpper === 'NA' || valueUpper === 'N/A') {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' } // Gray
      };
    }
  }

  private getDefinicion(question: any): string {
    // The definition could come from question metadata or be the question text itself
    if (question.metadata?.definicion) {
      return question.metadata.definicion;
    }
    return question.text;
  }

  private getPeriodicidad(question: any): string {
    // Get periodicidad from question metadata if available
    if (question.metadata?.periodicidad) {
      return question.metadata.periodicidad;
    }
    return 'ANUAL';
  }

  private formatDateTime(date: Date | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatDate(date: Date | null): string {
    if (!date) return 'unknown';
    return new Date(date).toISOString().split('T')[0];
  }

  private sanitizeFileName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }
}
