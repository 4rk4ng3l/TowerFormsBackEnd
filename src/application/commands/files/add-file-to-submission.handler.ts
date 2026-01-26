import { injectable, inject } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import { ICommandHandler } from '@shared/interfaces/command-handler.interface';
import { AddFileToSubmissionCommand } from './add-file-to-submission.command';
import { File } from '@domain/entities/file.entity';
import { ISubmissionRepository } from '@domain/repositories/submission.repository.interface';
import { IFileRepository } from '@domain/repositories/file.repository.interface';
import { NotFoundException } from '@shared/exceptions/not-found.exception';

@injectable()
export class AddFileToSubmissionHandler implements ICommandHandler<AddFileToSubmissionCommand, File> {
  constructor(
    @inject('ISubmissionRepository') private readonly submissionRepository: ISubmissionRepository,
    @inject('IFileRepository') private readonly fileRepository: IFileRepository
  ) {}

  async handle(command: AddFileToSubmissionCommand): Promise<File> {
    // Verify submission exists
    const submission = await this.submissionRepository.findById(command.submissionId);
    if (!submission) {
      throw NotFoundException.form(`Submission with ID '${command.submissionId}' not found`);
    }

    // Use provided fileId or generate new one
    const fileId = command.fileId || uuidv4();

    // Check if file already exists (metadata may have been created during sync)
    const existingFile = await this.fileRepository.findById(fileId);
    if (existingFile) {
      // If file exists but has no local path, update it with the uploaded file path
      if (!existingFile.localPath) {
        const updatedFile = existingFile.markAsSynced(command.filePath);
        await this.fileRepository.update(updatedFile);
        return updatedFile;
      }
      // File already fully synced, return existing
      return existingFile;
    }

    // Create file entity
    const file = File.create(
      fileId,
      command.submissionId,
      command.stepId,
      command.fileName,
      command.fileSize,
      command.mimeType,
      command.questionId,
      command.filePath
    );

    // Save to database
    const createdFile = await this.fileRepository.create(file);

    return createdFile;
  }
}
