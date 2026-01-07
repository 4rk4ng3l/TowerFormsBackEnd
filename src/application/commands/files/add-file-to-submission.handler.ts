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

    // Create file entity
    const file = File.create(
      uuidv4(),
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
