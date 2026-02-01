import { injectable, inject } from 'tsyringe';
import { ICommandHandler } from '@shared/interfaces/command-handler.interface';
import { SyncSubmissionsCommand, SyncSubmissionDto } from './sync-submissions.command';
import { Submission } from '@domain/entities/submission.entity';
import { Answer } from '@domain/entities/answer.entity';
import { File } from '@domain/entities/file.entity';
import { AnswerValue } from '@domain/value-objects/answer-value.vo';
import { ISubmissionRepository } from '@domain/repositories/submission.repository.interface';
import { IFileRepository } from '@domain/repositories/file.repository.interface';
import { ISiteRepository } from '@domain/repositories/site.repository.interface';
import { IFormRepository } from '@domain/repositories/form.repository.interface';
import { logger } from '@shared/utils/logger';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface SyncResult {
  syncedSubmissions: number;
  syncedFiles: number;
  errors: Array<{ submissionId: string; error: string }>;
}

@injectable()
export class SyncSubmissionsHandler implements ICommandHandler<SyncSubmissionsCommand, SyncResult> {
  constructor(
    @inject('ISubmissionRepository') private readonly submissionRepository: ISubmissionRepository,
    @inject('IFileRepository') private readonly fileRepository: IFileRepository,
    @inject('ISiteRepository') private readonly siteRepository: ISiteRepository,
    @inject('IFormRepository') private readonly formRepository: IFormRepository
  ) {}

  async handle(command: SyncSubmissionsCommand): Promise<SyncResult> {
    const result: SyncResult = {
      syncedSubmissions: 0,
      syncedFiles: 0,
      errors: []
    };

    logger.info('Starting sync process', { submissionCount: command.submissions.length });

    for (const submissionDto of command.submissions) {
      try {
        logger.info('Syncing submission', {
          submissionId: submissionDto.id,
          fileCount: submissionDto.files.length,
          answerCount: submissionDto.answers.length
        });

        await this.syncSubmission(submissionDto);
        result.syncedSubmissions++;
        result.syncedFiles += submissionDto.files.length;

        logger.info('Submission synced successfully', { submissionId: submissionDto.id });
      } catch (error: any) {
        logger.error('Error syncing submission', {
          submissionId: submissionDto.id,
          error: error.message,
          stack: error.stack
        });
        result.errors.push({
          submissionId: submissionDto.id,
          error: error.message || 'Unknown error occurred'
        });
      }
    }

    logger.info('Sync process completed', {
      syncedSubmissions: result.syncedSubmissions,
      syncedFiles: result.syncedFiles,
      failedSubmissions: result.errors.length
    });

    return result;
  }

  private async syncSubmission(dto: SyncSubmissionDto): Promise<void> {
    // Check if submission already exists
    let submission = await this.submissionRepository.findById(dto.id);

    if (submission) {
      // Update existing submission
      logger.info('Updating existing submission', { submissionId: dto.id });

      // Update metadata if provided
      if (dto.metadata) {
        submission = submission.updateMetadata(dto.metadata);
      }

      // Add answers
      for (const answerDto of dto.answers) {
        const answerValue = this.createAnswerValue(answerDto);
        const answer = Answer.create(
          answerDto.id,
          dto.id,
          answerDto.questionId,
          answerValue,
          answerDto.answerComment || null
        );
        submission = submission.addAnswer(answer);
      }

      // Complete if needed
      if (dto.completedAt && !submission.isCompleted()) {
        submission = submission.complete();
      }

      // Mark as synced
      submission = submission.markAsSynced();

      await this.submissionRepository.update(submission);
    } else {
      // Create new submission
      logger.info('Creating new submission from sync', { submissionId: dto.id });

      submission = Submission.create(
        dto.id,
        dto.formId,
        dto.userId,
        dto.metadata || null
      );

      // Add answers
      for (const answerDto of dto.answers) {
        const answerValue = this.createAnswerValue(answerDto);
        const answer = Answer.create(
          answerDto.id,
          dto.id,
          answerDto.questionId,
          answerValue,
          answerDto.answerComment || null
        );
        submission = submission.addAnswer(answer);
      }

      // Complete if needed
      if (dto.completedAt) {
        submission = submission.complete();
      }

      // Mark as synced
      submission = submission.markAsSynced();

      await this.submissionRepository.create(submission);
    }

    // Sync files
    await this.syncFiles(dto);

    // Sync new inventory elements if present in metadata
    await this.syncNewInventoryElements(dto);
  }

  private async syncNewInventoryElements(dto: SyncSubmissionDto): Promise<void> {
    // Check if metadata has newInventoryElements
    if (!dto.metadata || !dto.metadata.newInventoryElements) {
      return;
    }

    const newElements = dto.metadata.newInventoryElements;

    // Get the form to find the siteId
    const form = await this.formRepository.findById(dto.formId);
    if (!form || !form.siteId) {
      logger.warn('Cannot sync inventory elements: form or siteId not found', {
        formId: dto.formId,
        submissionId: dto.id
      });
      return;
    }

    const siteId = form.siteId;
    logger.info('Syncing new inventory elements', {
      submissionId: dto.id,
      siteId,
      eeCount: newElements.ee?.length || 0,
      epCount: newElements.ep?.length || 0
    });

    // Sync EE elements
    if (newElements.ee && Array.isArray(newElements.ee)) {
      for (const eeItem of newElements.ee) {
        try {
          const isNewElement = eeItem.isLocal || eeItem.id?.startsWith('local_');
          const isEditedElement = eeItem.isEdited && !isNewElement;

          if (isEditedElement) {
            // Update existing element
            await this.siteRepository.updateInventoryEE(eeItem.id, {
              tipoSoporte: eeItem.tipoSoporte || null,
              tipoEE: eeItem.tipoEE,
              situacion: eeItem.situacion || 'En servicio',
              situacionRRU: eeItem.situacionRRU || null,
              modelo: eeItem.modelo || null,
              fabricante: eeItem.fabricante || null,
              tipoExposicionViento: eeItem.tipoExposicionViento || null,
              aristaCaraMastil: eeItem.aristaCaraMastil || null,
              operadorPropietario: eeItem.operadorPropietario || null,
              alturaAntena: eeItem.alturaAntena,
              diametro: eeItem.diametro,
              largo: eeItem.largo,
              ancho: eeItem.ancho,
              fondo: eeItem.fondo,
              azimut: eeItem.azimut,
              epaM2: eeItem.epaM2,
              usoCompartido: eeItem.usoCompartido || false,
              sistemaMovil: eeItem.sistemaMovil || null,
              observaciones: eeItem.observaciones || null
            });

            logger.info('Inventory EE element updated', {
              siteId,
              id: eeItem.id,
              tipoEE: eeItem.tipoEE
            });
          } else if (isNewElement) {
            // Create new element
            const existingEE = await this.siteRepository.findInventoryEEBySiteId(siteId);
            const nextIdEE = existingEE.length > 0
              ? Math.max(...existingEE.map(e => e.idEE)) + 1
              : 1;

            await this.siteRepository.createInventoryEE({
              siteId,
              idEE: eeItem.idEE || nextIdEE,
              tipoSoporte: eeItem.tipoSoporte || null,
              tipoEE: eeItem.tipoEE,
              situacion: eeItem.situacion || 'En servicio',
              situacionRRU: eeItem.situacionRRU || null,
              modelo: eeItem.modelo || null,
              fabricante: eeItem.fabricante || null,
              tipoExposicionViento: eeItem.tipoExposicionViento || null,
              aristaCaraMastil: eeItem.aristaCaraMastil || null,
              operadorPropietario: eeItem.operadorPropietario || null,
              alturaAntena: eeItem.alturaAntena,
              diametro: eeItem.diametro,
              largo: eeItem.largo,
              ancho: eeItem.ancho,
              fondo: eeItem.fondo,
              azimut: eeItem.azimut,
              epaM2: eeItem.epaM2,
              usoCompartido: eeItem.usoCompartido || false,
              sistemaMovil: eeItem.sistemaMovil || null,
              observaciones: eeItem.observaciones || null
            });

            logger.info('Inventory EE element created', {
              siteId,
              tipoEE: eeItem.tipoEE,
              idEE: eeItem.idEE || nextIdEE
            });
          }
        } catch (error: any) {
          logger.error('Error syncing inventory EE element', {
            error: error.message,
            eeItem
          });
        }
      }
    }

    // Sync EP elements
    if (newElements.ep && Array.isArray(newElements.ep)) {
      for (const epItem of newElements.ep) {
        try {
          const isNewElement = epItem.isLocal || epItem.id?.startsWith('local_');
          const isEditedElement = epItem.isEdited && !isNewElement;

          // Handle dimensions which might be nested or flat
          const ancho = epItem.dimensiones?.ancho ?? epItem.ancho ?? null;
          const profundidad = epItem.dimensiones?.profundidad ?? epItem.profundidad ?? null;
          const altura = epItem.dimensiones?.altura ?? epItem.altura ?? null;

          if (isEditedElement) {
            // Update existing element
            await this.siteRepository.updateInventoryEP(epItem.id, {
              tipoPiso: epItem.tipoPiso || null,
              ubicacionEquipo: epItem.ubicacionEquipo || null,
              situacion: epItem.situacion || 'En servicio',
              estadoPiso: epItem.estadoPiso || null,
              modelo: epItem.modelo || null,
              fabricante: epItem.fabricante || null,
              usoEP: epItem.usoEP || null,
              operadorPropietario: epItem.operadorPropietario || null,
              ancho,
              profundidad,
              altura,
              superficieOcupada: epItem.superficieOcupada,
              observaciones: epItem.observaciones || null
            });

            logger.info('Inventory EP element updated', {
              siteId,
              id: epItem.id,
              tipoPiso: epItem.tipoPiso
            });
          } else if (isNewElement) {
            // Create new element
            const existingEP = await this.siteRepository.findInventoryEPBySiteId(siteId);
            const nextIdEP = existingEP.length > 0
              ? Math.max(...existingEP.map(e => e.idEP)) + 1
              : 1;

            await this.siteRepository.createInventoryEP({
              siteId,
              idEP: epItem.idEP || nextIdEP,
              tipoPiso: epItem.tipoPiso || null,
              ubicacionEquipo: epItem.ubicacionEquipo || null,
              situacion: epItem.situacion || 'En servicio',
              estadoPiso: epItem.estadoPiso || null,
              modelo: epItem.modelo || null,
              fabricante: epItem.fabricante || null,
              usoEP: epItem.usoEP || null,
              operadorPropietario: epItem.operadorPropietario || null,
              ancho,
              profundidad,
              altura,
              superficieOcupada: epItem.superficieOcupada,
              observaciones: epItem.observaciones || null
            });

            logger.info('Inventory EP element created', {
              siteId,
              tipoPiso: epItem.tipoPiso,
              idEP: epItem.idEP || nextIdEP
            });
          }
        } catch (error: any) {
          logger.error('Error syncing inventory EP element', {
            error: error.message,
            epItem
          });
        }
      }
    }
  }

  private async syncFiles(dto: SyncSubmissionDto): Promise<void> {
    const uploadsDir = process.env.UPLOAD_DIR || './uploads';

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    for (const fileDto of dto.files) {
      try {
        // Check if file already exists
        const existingFile = await this.fileRepository.findById(fileDto.id);

        if (existingFile) {
          logger.info('File already synced, skipping', { fileId: fileDto.id });
          continue;
        }

        // If no fileData, the file will be uploaded separately via /files/upload
        // Just create a placeholder entry in the database
        if (!fileDto.fileData) {
          logger.info('File metadata received, waiting for separate upload', {
            fileId: fileDto.id,
            fileName: fileDto.fileName
          });

          // Create file entity with pending status (no local path yet)
          const file = File.create(
            fileDto.id,
            dto.id,
            fileDto.stepId,
            fileDto.fileName,
            fileDto.fileSize,
            fileDto.mimeType,
            fileDto.questionId || null,
            null // No local path yet - will be set when file is uploaded
          );

          // Save to database as pending
          await this.fileRepository.create(file);

          logger.info('File metadata saved, awaiting upload', { fileId: fileDto.id });
          continue;
        }

        // Decode base64 file data (legacy support)
        const fileBuffer = Buffer.from(fileDto.fileData, 'base64');

        // Generate file path
        const fileName = `${fileDto.id}-${fileDto.fileName}`;
        const filePath = path.join(uploadsDir, fileName);

        // Save file to disk
        fs.writeFileSync(filePath, fileBuffer);

        // Create file entity
        const file = File.create(
          fileDto.id,
          dto.id,
          fileDto.stepId,
          fileDto.fileName,
          fileDto.fileSize,
          fileDto.mimeType,
          fileDto.questionId || null,
          filePath
        );

        // Mark as synced
        const syncedFile = file.markAsSynced(filePath);

        // Save to database
        await this.fileRepository.create(syncedFile);

        logger.info('File synced successfully', { fileId: fileDto.id, fileName: fileDto.fileName });
      } catch (error: any) {
        logger.error('Error syncing file', { fileId: fileDto.id, error: error.message });
        throw error;
      }
    }
  }

  private createAnswerValue(answerDto: any): AnswerValue {
    if (answerDto.answerText) {
      return AnswerValue.fromText(answerDto.answerText);
    } else if (answerDto.answerValue) {
      if (answerDto.answerValue.length === 1) {
        return AnswerValue.fromSingleChoice(answerDto.answerValue[0]);
      } else {
        return AnswerValue.fromMultipleChoice(answerDto.answerValue);
      }
    } else {
      throw new Error('Answer must have either answerText or answerValue');
    }
  }
}
