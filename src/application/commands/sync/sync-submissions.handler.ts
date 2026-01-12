import { injectable, inject } from 'tsyringe';
import { ICommandHandler } from '@shared/interfaces/command-handler.interface';
import { SyncSubmissionsCommand, SyncSubmissionDto } from './sync-submissions.command';
import { Submission } from '@domain/entities/submission.entity';
import { Answer } from '@domain/entities/answer.entity';
import { File } from '@domain/entities/file.entity';
import { AnswerValue } from '@domain/value-objects/answer-value.vo';
import { ISubmissionRepository } from '@domain/repositories/submission.repository.interface';
import { IFileRepository } from '@domain/repositories/file.repository.interface';
import { logger } from '@shared/utils/logger';
import fs from 'fs';
import path from 'path';

interface SyncResult {
  syncedSubmissions: number;
  syncedFiles: number;
  errors: Array<{ submissionId: string; error: string }>;
}

@injectable()
export class SyncSubmissionsHandler implements ICommandHandler<SyncSubmissionsCommand, SyncResult> {
  constructor(
    @inject('ISubmissionRepository') private readonly submissionRepository: ISubmissionRepository,
    @inject('IFileRepository') private readonly fileRepository: IFileRepository
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
          answerValue
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
          answerValue
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

        // Decode base64 file data
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
