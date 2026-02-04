import { injectable, inject } from 'tsyringe';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { SubmissionForExport } from '@application/queries/export/get-submission-for-export.handler';
import { SiteRepository } from '@infrastructure/persistence/postgresql/repositories/site.repository';
import { InventoryEE } from '@domain/entities/inventory-ee.entity';
import { InventoryEP } from '@domain/entities/inventory-ep.entity';

export interface ExcelExportResult {
  url: string;
  fileName: string;
  filePath: string;
}

// ============================================
// CONFIGURACIÓN DE LAYOUT POR TIPO DE SITIO
// ============================================

interface ColumnConfig {
  width: number;
  header: string;
}

interface MetadataFieldConfig {
  key: string;           // Clave en metadata
  label: string;         // Etiqueta a mostrar
  column: number;        // Columna (1-9)
  row: 'first' | 'second'; // Fila de metadata
  colspan?: number;      // Columnas a combinar
}

interface SiteTypeConfig {
  // Colores
  styles: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    textOnPrimary: string;
  };
  // Columnas del checklist
  columns: ColumnConfig[];
  // Campos de metadata y su ubicación
  metadataFields: {
    firstRow: MetadataFieldConfig[];
    secondRow: MetadataFieldConfig[];
  };
  // Título personalizado
  titlePrefix: string;
  // Filas del título (altura)
  titleRows: number;
}

function getSiteTypeConfig(siteType: string): SiteTypeConfig {
  const type = siteType?.toUpperCase() || '';

  switch (type) {
    case 'GREENFIELD':
      return {
        styles: {
          primaryColor: 'FF2E7D32',     // Verde oscuro
          secondaryColor: 'FFE8F5E9',   // Verde claro
          accentColor: 'FF4CAF50',      // Verde medio
          textOnPrimary: 'FFFFFFFF'
        },
        columns: [
          { width: 20, header: 'Actividad' },
          { width: 30, header: 'Descripción' },
          { width: 35, header: 'Definición' },
          { width: 22, header: 'Clasificación Hallazgo' },
          { width: 15, header: 'Periodicidad' },
          { width: 25, header: 'Observaciones' },
          { width: 20, header: '' },
          { width: 20, header: '' },
          { width: 20, header: '' }
        ],
        metadataFields: {
          firstRow: [
            { key: 'codigoSitio', label: 'CÓDIGO DEL SITIO', column: 1, row: 'first' },
            { key: 'nombreSitio', label: 'NOMBRE SITIO', column: 2, row: 'first', colspan: 2 },
            { key: 'latitud', label: 'LATITUD', column: 4, row: 'first' },
            { key: 'longitud', label: 'LONGITUD', column: 5, row: 'first' },
            { key: 'direccion', label: 'DIRECCIÓN', column: 6, row: 'first', colspan: 3 },
            { key: 'regional', label: 'REGIONAL', column: 9, row: 'first' }
          ],
          secondRow: [
            { key: 'tipoSitio', label: 'TIPO DE SITIO', column: 1, row: 'second' },
            { key: 'empresa', label: 'EMPRESA', column: 2, row: 'second' },
            { key: 'coordinador', label: 'COORDINADOR', column: 3, row: 'second', colspan: 2 },
            { key: 'fechaEjecucion', label: 'FECHA EJECUCIÓN', column: 5, row: 'second', colspan: 2 },
            { key: 'numeroTK', label: 'NÚMERO TK', column: 7, row: 'second', colspan: 2 },
            { key: 'alturaTorre', label: 'ALTURA TORRE', column: 9, row: 'second' }
          ]
        },
        titlePrefix: 'RUTINA MANTENIMIENTO PREVENTIVO GREENFIELD',
        titleRows: 6
      };

    case 'ROOFTOP':
      return {
        styles: {
          primaryColor: 'FF1565C0',     // Azul oscuro
          secondaryColor: 'FFE3F2FD',   // Azul claro
          accentColor: 'FF2196F3',      // Azul medio
          textOnPrimary: 'FFFFFFFF'
        },
        columns: [
          { width: 18, header: 'Actividad' },
          { width: 28, header: 'Descripción' },
          { width: 30, header: 'Definición' },
          { width: 20, header: 'Clasificación' },
          { width: 15, header: 'Periodicidad' },
          { width: 22, header: 'Observaciones' },
          { width: 18, header: '' },
          { width: 18, header: '' },
          { width: 18, header: '' }
        ],
        metadataFields: {
          firstRow: [
            { key: 'codigoSitio', label: 'CÓDIGO SITIO', column: 1, row: 'first' },
            { key: 'nombreSitio', label: 'NOMBRE SITIO', column: 2, row: 'first', colspan: 2 },
            { key: 'direccion', label: 'DIRECCIÓN EDIFICIO', column: 4, row: 'first', colspan: 3 },
            { key: 'pisoUbicacion', label: 'PISO/UBICACIÓN', column: 7, row: 'first', colspan: 2 },
            { key: 'regional', label: 'REGIONAL', column: 9, row: 'first' }
          ],
          secondRow: [
            { key: 'tipoSitio', label: 'TIPO DE SITIO', column: 1, row: 'second' },
            { key: 'empresa', label: 'EMPRESA', column: 2, row: 'second' },
            { key: 'coordinador', label: 'COORDINADOR', column: 3, row: 'second', colspan: 2 },
            { key: 'fechaEjecucion', label: 'FECHA EJECUCIÓN', column: 5, row: 'second', colspan: 2 },
            { key: 'numeroTK', label: 'NÚMERO TK', column: 7, row: 'second', colspan: 2 },
            { key: 'propietarioEdificio', label: 'PROPIETARIO', column: 9, row: 'second' }
          ]
        },
        titlePrefix: 'RUTINA MANTENIMIENTO PREVENTIVO ROOFTOP',
        titleRows: 5
      };

    case 'POSTEVIA':
      return {
        styles: {
          primaryColor: 'FFE65100',     // Naranja oscuro
          secondaryColor: 'FFFFF3E0',   // Naranja claro
          accentColor: 'FFFF9800',      // Naranja medio
          textOnPrimary: 'FFFFFFFF'
        },
        columns: [
          { width: 18, header: 'Actividad' },
          { width: 25, header: 'Descripción' },
          { width: 32, header: 'Definición' },
          { width: 20, header: 'Clasificación' },
          { width: 15, header: 'Periodicidad' },
          { width: 20, header: 'Observaciones' },
          { width: 18, header: '' },
          { width: 18, header: '' },
          { width: 18, header: '' }
        ],
        metadataFields: {
          firstRow: [
            { key: 'codigoSitio', label: 'CÓDIGO POSTE', column: 1, row: 'first' },
            { key: 'nombreSitio', label: 'IDENTIFICACIÓN', column: 2, row: 'first', colspan: 2 },
            { key: 'latitud', label: 'LATITUD', column: 4, row: 'first' },
            { key: 'longitud', label: 'LONGITUD', column: 5, row: 'first' },
            { key: 'direccion', label: 'DIRECCIÓN/RUTA', column: 6, row: 'first', colspan: 3 },
            { key: 'regional', label: 'REGIONAL', column: 9, row: 'first' }
          ],
          secondRow: [
            { key: 'tipoSitio', label: 'TIPO POSTE', column: 1, row: 'second' },
            { key: 'empresa', label: 'EMPRESA', column: 2, row: 'second' },
            { key: 'coordinador', label: 'COORDINADOR', column: 3, row: 'second', colspan: 2 },
            { key: 'fechaEjecucion', label: 'FECHA EJECUCIÓN', column: 5, row: 'second', colspan: 2 },
            { key: 'numeroTK', label: 'NÚMERO TK', column: 7, row: 'second', colspan: 2 },
            { key: 'alturaPoste', label: 'ALTURA POSTE', column: 9, row: 'second' }
          ]
        },
        titlePrefix: 'RUTINA MANTENIMIENTO PREVENTIVO POSTEVIA',
        titleRows: 5
      };

    default:
      // Configuración por defecto (original)
      return {
        styles: {
          primaryColor: 'FF4472C4',
          secondaryColor: 'FFD9E1F2',
          accentColor: 'FF5B9BD5',
          textOnPrimary: 'FFFFFFFF'
        },
        columns: [
          { width: 18, header: 'Actividad' },
          { width: 25, header: 'Descripción' },
          { width: 35, header: 'Definición' },
          { width: 20, header: 'Clasificación Hallazgo' },
          { width: 15, header: 'Periodicidad' },
          { width: 20, header: 'Observaciones' },
          { width: 20, header: '' },
          { width: 20, header: '' },
          { width: 20, header: '' }
        ],
        metadataFields: {
          firstRow: [
            { key: 'codigoSitio', label: 'CÓDIGO DEL SITIO', column: 1, row: 'first' },
            { key: 'nombreSitio', label: 'NOMBRE SITIO', column: 2, row: 'first', colspan: 2 },
            { key: 'latitud', label: 'LATITUD', column: 4, row: 'first' },
            { key: 'longitud', label: 'LONGITUD', column: 5, row: 'first' },
            { key: 'direccion', label: 'DIRECCIÓN', column: 6, row: 'first', colspan: 3 },
            { key: 'regional', label: 'REGIONAL', column: 9, row: 'first' }
          ],
          secondRow: [
            { key: 'tipoSitio', label: 'TIPO DE SITIO', column: 1, row: 'second' },
            { key: 'empresa', label: 'EMPRESA', column: 2, row: 'second' },
            { key: 'coordinador', label: 'COORDINADOR CONTRATISTA', column: 3, row: 'second', colspan: 2 },
            { key: 'fechaEjecucion', label: 'FECHA DE EJECUCIÓN', column: 5, row: 'second', colspan: 2 },
            { key: 'numeroTK', label: 'NÚMERO DE TK', column: 7, row: 'second', colspan: 2 }
          ]
        },
        titlePrefix: 'RUTINA MANTENIMIENTO PREVENTIVO',
        titleRows: 6
      };
  }
}

@injectable()
export class ExcelGeneratorService {
  private readonly exportsDir: string;
  private readonly baseUrl: string;
  private readonly siteRepository: SiteRepository;
  private currentConfig: SiteTypeConfig = getSiteTypeConfig('');

  constructor() {
    this.exportsDir = process.env.EXPORTS_DIR || './uploads/exports';
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.siteRepository = new SiteRepository();

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

    // Set config based on site type
    const metadata = data.submission.metadata || {};
    const siteType = metadata.tipoSitio || metadata.siteType || '';
    this.currentConfig = getSiteTypeConfig(siteType);

    // Create main sheet following original format
    await this.createMainSheet(workbook, data);

    // Add inventory sheets if site code is available in metadata
    const codigoSitio = metadata.codigoSitio || metadata.siteCode;

    if (codigoSitio) {
      try {
        const site = await this.siteRepository.findByCode(codigoSitio);
        if (site) {
          const [inventoryEE, inventoryEP] = await Promise.all([
            this.siteRepository.findInventoryEEBySiteId(site.id),
            this.siteRepository.findInventoryEPBySiteId(site.id)
          ]);

          if (inventoryEE.length > 0) {
            await this.createInventoryEESheet(workbook, inventoryEE, codigoSitio);
          }

          if (inventoryEP.length > 0) {
            await this.createInventoryEPSheet(workbook, inventoryEP, codigoSitio);
          }
        }
      } catch (error) {
        console.error('[ExcelGenerator] Error loading site inventory:', error);
        // Continue without inventory sheets
      }
    }

    // Add Torque sheet if torqueData is available in metadata
    if (metadata.torqueData && Object.keys(metadata.torqueData).length > 0) {
      try {
        await this.createTorqueSheet(workbook, metadata.torqueData, codigoSitio || 'N/A');
      } catch (error) {
        console.error('[ExcelGenerator] Error creating torque sheet:', error);
        // Continue without torque sheet
      }
    }

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
    const config = this.currentConfig;

    // Set column widths from config
    sheet.columns = config.columns.map(col => ({ width: col.width }));

    let currentRow = 1;

    // ============================================
    // SECTION 1: HEADER - Title (dynamic rows)
    // ============================================
    const titleText = `${config.titlePrefix} - ${data.form.name.toUpperCase()}`;

    for (let i = 0; i < config.titleRows; i++) {
      const row = sheet.getRow(currentRow + i);
      row.getCell(1).value = titleText;
      row.height = 20;
    }

    sheet.mergeCells(`A1:I${config.titleRows}`);
    const titleCell = sheet.getCell('A1');
    titleCell.font = { bold: true, size: 16, color: { argb: config.styles.textOnPrimary } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: config.styles.primaryColor }
    };

    currentRow = config.titleRows + 1;

    // Empty row
    currentRow++;

    // ============================================
    // SECTION 2: METADATA - Dynamic from config
    // ============================================
    const metadata = data.submission.metadata || {};

    // First row of metadata - Labels
    currentRow = this.renderMetadataRow(sheet, currentRow, config.metadataFields.firstRow, metadata, data, true);

    // First row of metadata - Values
    currentRow = this.renderMetadataRow(sheet, currentRow, config.metadataFields.firstRow, metadata, data, false);

    // Empty row
    currentRow++;

    // Second row of metadata - Labels
    currentRow = this.renderMetadataRow(sheet, currentRow, config.metadataFields.secondRow, metadata, data, true);

    // Second row of metadata - Values
    currentRow = this.renderMetadataRow(sheet, currentRow, config.metadataFields.secondRow, metadata, data, false);

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

    // Header row for checklist - use headers from config
    const checklistHeader = sheet.getRow(currentRow);
    checklistHeader.values = config.columns.map(col => col.header);
    this.styleHeaderRow(checklistHeader);
    checklistHeader.font = { bold: true, size: 11, color: { argb: config.styles.textOnPrimary } };
    checklistHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: config.styles.primaryColor }
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
      fgColor: { argb: this.currentConfig.styles.secondaryColor }
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

  private renderMetadataRow(
    sheet: ExcelJS.Worksheet,
    currentRow: number,
    fields: MetadataFieldConfig[],
    metadata: any,
    data: SubmissionForExport,
    isLabel: boolean
  ): number {
    const row = sheet.getRow(currentRow);
    const values: (string | number)[] = ['', '', '', '', '', '', '', '', ''];
    const merges: { start: number; end: number }[] = [];

    for (const field of fields) {
      const col = field.column - 1; // 0-indexed

      if (isLabel) {
        values[col] = field.label;
      } else {
        // Get value from metadata or special fields
        let value = this.getMetadataValue(field.key, metadata, data);
        values[col] = value;
      }

      // Track merges
      if (field.colspan && field.colspan > 1) {
        merges.push({ start: field.column, end: field.column + field.colspan - 1 });
        // Fill colspan cells with same value for merge
        for (let i = 1; i < field.colspan; i++) {
          values[col + i] = values[col];
        }
      }
    }

    row.values = values;

    if (isLabel) {
      this.styleHeaderRow(row);
    } else {
      this.styleDataRow(row);
    }

    // Apply merges
    for (const merge of merges) {
      const startCol = String.fromCharCode(64 + merge.start);
      const endCol = String.fromCharCode(64 + merge.end);
      sheet.mergeCells(`${startCol}${currentRow}:${endCol}${currentRow}`);
    }

    return currentRow + 1;
  }

  private getMetadataValue(key: string, metadata: any, data: SubmissionForExport): string {
    // Map of alternative keys for each field
    const keyMappings: Record<string, string[]> = {
      codigoSitio: ['codigoSitio', 'siteCode', 'codigo'],
      nombreSitio: ['nombreSitio', 'siteName', 'nombre'],
      latitud: ['latitud', 'latitude', 'lat'],
      longitud: ['longitud', 'longitude', 'lng', 'lon'],
      direccion: ['direccion', 'address', 'dir'],
      regional: ['regional', 'region'],
      tipoSitio: ['tipoSitio', 'siteType', 'tipo'],
      empresa: ['empresa', 'company'],
      coordinador: ['coordinador', 'coordinator'],
      numeroTK: ['numeroTK', 'ticketNumber', 'tk'],
      alturaTorre: ['alturaTorre', 'towerHeight', 'altura'],
      alturaPoste: ['alturaPoste', 'poleHeight'],
      pisoUbicacion: ['pisoUbicacion', 'floorLocation', 'piso'],
      propietarioEdificio: ['propietarioEdificio', 'buildingOwner', 'propietario']
    };

    const alternatives = keyMappings[key] || [key];

    for (const alt of alternatives) {
      if (metadata[alt] !== undefined && metadata[alt] !== null && metadata[alt] !== '') {
        return String(metadata[alt]);
      }
    }

    // Special cases
    if (key === 'coordinador') {
      return `${data.user.firstName} ${data.user.lastName}`;
    }
    if (key === 'fechaEjecucion') {
      return this.formatDateTime(data.submission.completedAt || data.submission.startedAt);
    }
    if (key === 'empresa') {
      return 'IENERCOM';
    }

    return 'N/A';
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
    // Priority: 1) question.description, 2) metadata.definicion, 3) question.text
    if (question.description) {
      return question.description;
    }
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

  // ============================================
  // INVENTORY SHEETS
  // ============================================

  private async createInventoryEESheet(
    workbook: ExcelJS.Workbook,
    inventoryEE: InventoryEE[],
    codigoSitio: string
  ): Promise<void> {
    const sheet = workbook.addWorksheet('Inventario EE');

    // Set column widths
    sheet.columns = [
      { width: 8, header: 'ID EE' },
      { width: 15, header: 'Tipo Soporte' },
      { width: 15, header: 'Tipo EE' },
      { width: 15, header: 'Situación' },
      { width: 15, header: 'Modelo' },
      { width: 15, header: 'Fabricante' },
      { width: 15, header: 'Arista Cara Mástil' },
      { width: 18, header: 'Operador Propietario' },
      { width: 12, header: 'Altura (m)' },
      { width: 10, header: 'Azimut' },
      { width: 10, header: 'EPA (m²)' },
      { width: 12, header: 'Uso Compartido' },
      { width: 30, header: 'Observaciones' },
    ];

    // Title row
    const titleRow = sheet.getRow(1);
    titleRow.getCell(1).value = `INVENTARIO ELEMENTOS EN ESTRUCTURA - ${codigoSitio}`;
    sheet.mergeCells('A1:M1');
    titleRow.font = { bold: true, size: 14, color: { argb: this.currentConfig.styles.textOnPrimary } };
    titleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: this.currentConfig.styles.primaryColor }
    };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    titleRow.height = 30;

    // Header row
    const headerRow = sheet.getRow(2);
    headerRow.values = [
      'ID EE',
      'Tipo Soporte',
      'Tipo EE',
      'Situación',
      'Modelo',
      'Fabricante',
      'Arista Cara Mástil',
      'Operador Propietario',
      'Altura (m)',
      'Azimut',
      'EPA (m²)',
      'Uso Compartido',
      'Observaciones'
    ];
    headerRow.font = { bold: true, size: 10 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: this.currentConfig.styles.secondaryColor }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.eachCell((cell) => {
      cell.border = this.getThinBorder();
    });

    // Data rows
    let currentRow = 3;
    for (const item of inventoryEE) {
      const row = sheet.getRow(currentRow);
      row.values = [
        item.idEE,
        item.tipoSoporte || '',
        item.tipoEE,
        item.situacion,
        item.modelo || '',
        item.fabricante || '',
        item.aristaCaraMastil || '',
        item.operadorPropietario || '',
        item.alturaAntena || '',
        item.azimut || '',
        item.epaM2 || '',
        item.usoCompartido ? 'Sí' : 'No',
        item.observaciones || ''
      ];

      row.eachCell((cell) => {
        cell.border = this.getThinBorder();
        cell.alignment = { vertical: 'middle', wrapText: true };
      });

      // Alternate row colors
      if (currentRow % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        };
      }

      currentRow++;
    }

    // Footer with totals
    currentRow++;
    const footerRow = sheet.getRow(currentRow);
    footerRow.getCell(1).value = `Total elementos: ${inventoryEE.length}`;
    footerRow.font = { bold: true, italic: true };
  }

  private async createInventoryEPSheet(
    workbook: ExcelJS.Workbook,
    inventoryEP: InventoryEP[],
    codigoSitio: string
  ): Promise<void> {
    const sheet = workbook.addWorksheet('Inventario EP');

    // Set column widths
    sheet.columns = [
      { width: 8, header: 'ID EP' },
      { width: 15, header: 'Tipo Piso' },
      { width: 18, header: 'Ubicación Equipo' },
      { width: 15, header: 'Situación' },
      { width: 15, header: 'Estado Piso' },
      { width: 15, header: 'Modelo' },
      { width: 15, header: 'Fabricante' },
      { width: 15, header: 'Uso EP' },
      { width: 18, header: 'Operador Propietario' },
      { width: 10, header: 'Ancho (m)' },
      { width: 12, header: 'Profundidad (m)' },
      { width: 10, header: 'Altura (m)' },
      { width: 15, header: 'Superficie (m²)' },
      { width: 30, header: 'Observaciones' },
    ];

    // Title row
    const titleRow = sheet.getRow(1);
    titleRow.getCell(1).value = `INVENTARIO EQUIPOS EN PISO - ${codigoSitio}`;
    sheet.mergeCells('A1:N1');
    titleRow.font = { bold: true, size: 14, color: { argb: this.currentConfig.styles.textOnPrimary } };
    titleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: this.currentConfig.styles.primaryColor }
    };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    titleRow.height = 30;

    // Header row
    const headerRow = sheet.getRow(2);
    headerRow.values = [
      'ID EP',
      'Tipo Piso',
      'Ubicación Equipo',
      'Situación',
      'Estado Piso',
      'Modelo',
      'Fabricante',
      'Uso EP',
      'Operador Propietario',
      'Ancho (m)',
      'Profundidad (m)',
      'Altura (m)',
      'Superficie (m²)',
      'Observaciones'
    ];
    headerRow.font = { bold: true, size: 10 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: this.currentConfig.styles.secondaryColor }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.eachCell((cell) => {
      cell.border = this.getThinBorder();
    });

    // Data rows
    let currentRow = 3;
    for (const item of inventoryEP) {
      const row = sheet.getRow(currentRow);
      row.values = [
        item.idEP,
        item.tipoPiso || '',
        item.ubicacionEquipo || '',
        item.situacion,
        item.estadoPiso || '',
        item.modelo || '',
        item.fabricante || '',
        item.usoEP || '',
        item.operadorPropietario || '',
        item.ancho || '',
        item.profundidad || '',
        item.altura || '',
        item.superficieOcupada || '',
        item.observaciones || ''
      ];

      row.eachCell((cell) => {
        cell.border = this.getThinBorder();
        cell.alignment = { vertical: 'middle', wrapText: true };
      });

      // Alternate row colors
      if (currentRow % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        };
      }

      currentRow++;
    }

    // Footer with totals
    currentRow++;
    const footerRow = sheet.getRow(currentRow);
    footerRow.getCell(1).value = `Total equipos: ${inventoryEP.length}`;
    footerRow.font = { bold: true, italic: true };
  }

  // ============================================
  // TORQUE SHEET
  // ============================================

  private async createTorqueSheet(
    workbook: ExcelJS.Workbook,
    torqueData: any,
    codigoSitio: string
  ): Promise<void> {
    const sheet = workbook.addWorksheet('Torque');

    // Franjas definition (same as mobile app)
    const FRANJAS = [
      { id: '0-6', label: 'FRANJA 0 - 6 m' },
      { id: '6-12', label: 'FRANJA 6 - 12 m' },
      { id: '12-18', label: 'FRANJA 12 - 18 m' },
      { id: '18-24', label: 'FRANJA 18 - 24 m' },
      { id: '24-30', label: 'FRANJA 24 - 30 m' },
      { id: '30-36', label: 'FRANJA 30 - 36 m' },
      { id: '36-42', label: 'FRANJA 36 - 42 m' },
      { id: '42-48', label: 'FRANJA 42 - 48 m' },
      { id: '48-54', label: 'FRANJA 48 - 54 m' },
      { id: '54-60', label: 'FRANJA 54 - 60 m' },
    ];

    const ELEMENTO_TYPES = ['MONTANTE', 'DIAGONAL', 'CIERRE', 'ESCALERILLA', 'BRIDA'];

    // Set column widths
    sheet.columns = [
      { width: 20, header: 'Franja' },
      { width: 15, header: 'Elemento' },
      { width: 15, header: 'Diámetro Tornillo' },
      { width: 15, header: 'Torque (N·m)' },
      { width: 18, header: 'Cant. Tornillos' },
      { width: 12, header: 'No Pasan' },
      { width: 15, header: '% Cumplimiento' },
    ];

    // Title row
    const titleRow = sheet.getRow(1);
    titleRow.getCell(1).value = `PRUEBAS DE TORQUE - ${codigoSitio}`;
    sheet.mergeCells('A1:G1');
    titleRow.font = { bold: true, size: 14, color: { argb: this.currentConfig.styles.textOnPrimary } };
    titleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: this.currentConfig.styles.primaryColor }
    };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    titleRow.height = 30;

    // Reference table header
    const refHeaderRow = sheet.getRow(2);
    refHeaderRow.getCell(1).value = 'TABLA DE REFERENCIA DE TORQUES';
    sheet.mergeCells('A2:G2');
    refHeaderRow.font = { bold: true, size: 11 };
    refHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2EFDA' }
    };
    refHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Reference table data
    const TORQUE_REFERENCE = [
      { diametro: 'M16 (5/8")', torqueNm: 50 },
      { diametro: 'M18 (3/4")', torqueNm: 80 },
      { diametro: 'M20 (7/8")', torqueNm: 110 },
      { diametro: 'M22', torqueNm: 140 },
      { diametro: 'M24 (1")', torqueNm: 180 },
      { diametro: 'M27 (1-1/8")', torqueNm: 320 },
      { diametro: 'M30 (1-1/4")', torqueNm: 515 },
      { diametro: 'M33 (1-3/8")', torqueNm: 775 },
    ];

    let currentRow = 3;
    const refStartRow = currentRow;

    // Reference table headers
    const refColHeaders = sheet.getRow(currentRow);
    refColHeaders.getCell(1).value = 'Diámetro Tornillo';
    refColHeaders.getCell(2).value = 'Torque (N·m)';
    refColHeaders.font = { bold: true, size: 10 };
    refColHeaders.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: this.currentConfig.styles.secondaryColor }
    };
    sheet.mergeCells(`C${currentRow}:G${currentRow}`);
    currentRow++;

    for (const ref of TORQUE_REFERENCE) {
      const row = sheet.getRow(currentRow);
      row.getCell(1).value = ref.diametro;
      row.getCell(2).value = ref.torqueNm;
      row.getCell(1).border = this.getThinBorder();
      row.getCell(2).border = this.getThinBorder();
      currentRow++;
    }

    // Empty row
    currentRow++;

    // Data header row
    const headerRow = sheet.getRow(currentRow);
    headerRow.values = [
      'Franja',
      'Elemento',
      'Diámetro Tornillo',
      'Torque (N·m)',
      'Cant. Tornillos',
      'No Pasan',
      '% Cumplimiento'
    ];
    headerRow.font = { bold: true, size: 10, color: { argb: this.currentConfig.styles.textOnPrimary } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: this.currentConfig.styles.primaryColor }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.eachCell((cell) => {
      cell.border = this.getThinBorder();
    });
    currentRow++;

    // Data rows - iterate through franjas and elementos
    let totalTornillos = 0;
    let totalNoPasan = 0;
    let hasData = false;

    for (const franja of FRANJAS) {
      const franjaData = torqueData[franja.id];
      if (!franjaData) continue;

      for (const elemento of ELEMENTO_TYPES) {
        const elementoData = franjaData[elemento];
        if (!elementoData || !elementoData.tornillos || elementoData.tornillos.length === 0) continue;

        for (const tornillo of elementoData.tornillos) {
          const cantidad = parseInt(tornillo.cantidadTornillos) || 0;
          const noPasan = parseInt(tornillo.noPasan) || 0;
          const porcentaje = cantidad > 0
            ? (((cantidad - noPasan) / cantidad) * 100).toFixed(1)
            : '0.0';

          totalTornillos += cantidad;
          totalNoPasan += noPasan;
          hasData = true;

          const row = sheet.getRow(currentRow);
          row.values = [
            franja.label,
            elemento,
            tornillo.diametroTornillo || 'N/A',
            tornillo.torqueAplicar || 'N/A',
            cantidad,
            noPasan,
            `${porcentaje}%`
          ];

          row.alignment = { vertical: 'middle', horizontal: 'center' };
          row.eachCell((cell) => {
            cell.border = this.getThinBorder();
          });

          // Color code percentage
          const percentCell = row.getCell(7);
          const percentValue = parseFloat(porcentaje);
          if (percentValue >= 95) {
            percentCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFC6EFCE' } // Green
            };
            percentCell.font = { color: { argb: 'FF006100' }, bold: true };
          } else if (percentValue >= 80) {
            percentCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFEB9C' } // Yellow
            };
            percentCell.font = { color: { argb: 'FF9C5700' }, bold: true };
          } else {
            percentCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFC7CE' } // Red
            };
            percentCell.font = { color: { argb: 'FF9C0006' }, bold: true };
          }

          // Highlight if there are failures
          if (noPasan > 0) {
            row.getCell(6).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFC7CE' }
            };
            row.getCell(6).font = { color: { argb: 'FF9C0006' }, bold: true };
          }

          // Alternate row colors (except special cells)
          if (currentRow % 2 === 0) {
            for (let col = 1; col <= 5; col++) {
              if (!row.getCell(col).fill || (row.getCell(col).fill as any).fgColor?.argb !== 'FFFFC7CE') {
                row.getCell(col).fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFF2F2F2' }
                };
              }
            }
          }

          currentRow++;
        }
      }
    }

    // If no data, add a message
    if (!hasData) {
      const noDataRow = sheet.getRow(currentRow);
      noDataRow.getCell(1).value = 'No hay datos de torque registrados';
      sheet.mergeCells(`A${currentRow}:G${currentRow}`);
      noDataRow.alignment = { vertical: 'middle', horizontal: 'center' };
      noDataRow.font = { italic: true, color: { argb: 'FF666666' } };
      currentRow++;
    }

    // Summary row
    currentRow++;
    const summaryHeaderRow = sheet.getRow(currentRow);
    summaryHeaderRow.getCell(1).value = 'RESUMEN GENERAL';
    sheet.mergeCells(`A${currentRow}:G${currentRow}`);
    summaryHeaderRow.font = { bold: true, size: 11 };
    summaryHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: this.currentConfig.styles.secondaryColor }
    };
    summaryHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
    currentRow++;

    const totalPorcentaje = totalTornillos > 0
      ? (((totalTornillos - totalNoPasan) / totalTornillos) * 100).toFixed(1)
      : '0.0';

    const summaryRow = sheet.getRow(currentRow);
    summaryRow.values = [
      'TOTAL',
      '',
      '',
      '',
      totalTornillos,
      totalNoPasan,
      `${totalPorcentaje}%`
    ];
    summaryRow.font = { bold: true };
    summaryRow.alignment = { vertical: 'middle', horizontal: 'center' };
    summaryRow.eachCell((cell) => {
      cell.border = this.getThinBorder();
    });

    // Color code total percentage
    const totalPercentCell = summaryRow.getCell(7);
    const totalPercentValue = parseFloat(totalPorcentaje);
    if (totalPercentValue >= 95) {
      totalPercentCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFC6EFCE' }
      };
      totalPercentCell.font = { color: { argb: 'FF006100' }, bold: true };
    } else if (totalPercentValue >= 80) {
      totalPercentCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFEB9C' }
      };
      totalPercentCell.font = { color: { argb: 'FF9C5700' }, bold: true };
    } else {
      totalPercentCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFC7CE' }
      };
      totalPercentCell.font = { color: { argb: 'FF9C0006' }, bold: true };
    }

    sheet.mergeCells(`A${currentRow}:D${currentRow}`);
  }
}
