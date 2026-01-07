import { injectable, inject } from 'tsyringe';
import { IQueryHandler } from '@shared/interfaces/query-handler.interface';
import { GetPendingSyncDataQuery } from './get-pending-sync-data.query';
import { ISubmissionRepository } from '@domain/repositories/submission.repository.interface';
import { IFileRepository } from '@domain/repositories/file.repository.interface';

interface PendingSyncData {
  submissions: any[];
  files: any[];
}

@injectable()
export class GetPendingSyncDataHandler implements IQueryHandler<GetPendingSyncDataQuery, PendingSyncData> {
  constructor(
    @inject('ISubmissionRepository') private readonly submissionRepository: ISubmissionRepository,
    @inject('IFileRepository') private readonly fileRepository: IFileRepository
  ) {}

  async handle(query: GetPendingSyncDataQuery): Promise<PendingSyncData> {
    // Get unsynced submissions
    const unsyncedSubmissions = await this.submissionRepository.findUnsynced();

    // Filter by user if provided
    const filteredSubmissions = query.userId
      ? unsyncedSubmissions.filter(s => s.userId === query.userId)
      : unsyncedSubmissions;

    // Get unsynced files
    const unsyncedFiles = await this.fileRepository.findUnsynced();

    // Map to DTOs
    const submissions = filteredSubmissions.map(submission => ({
      id: submission.id,
      formId: submission.formId,
      userId: submission.userId,
      metadata: submission.metadata,
      startedAt: submission.startedAt,
      completedAt: submission.completedAt,
      answers: submission.answers.map(answer => ({
        id: answer.id,
        questionId: answer.questionId,
        value: answer.getValue()
      })),
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt
    }));

    const files = unsyncedFiles.map(file => ({
      id: file.id,
      submissionId: file.submissionId,
      stepId: file.stepId,
      questionId: file.questionId,
      fileName: file.fileName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      remotePath: file.remotePath,
      createdAt: file.createdAt
    }));

    return {
      submissions,
      files
    };
  }
}
