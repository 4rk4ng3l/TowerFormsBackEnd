import { injectable, inject } from 'tsyringe';
import { IQueryHandler } from '@shared/interfaces/query-handler.interface';
import { GetSubmissionQuery } from './get-submission.query';
import { ISubmissionRepository } from '@domain/repositories/submission.repository.interface';
import { NotFoundException } from '@shared/exceptions/not-found.exception';

@injectable()
export class GetSubmissionHandler implements IQueryHandler<GetSubmissionQuery, any> {
  constructor(
    @inject('ISubmissionRepository') private readonly submissionRepository: ISubmissionRepository
  ) {}

  async handle(query: GetSubmissionQuery): Promise<any> {
    const submission = await this.submissionRepository.findById(query.submissionId);

    if (!submission) {
      throw NotFoundException.form(`Submission with ID '${query.submissionId}' not found`);
    }

    return {
      id: submission.id,
      formId: submission.formId,
      userId: submission.userId,
      metadata: submission.metadata,
      startedAt: submission.startedAt,
      completedAt: submission.completedAt,
      synced: submission.isSynced(),
      syncedAt: submission.syncedAt,
      answers: submission.answers.map(answer => ({
        id: answer.id,
        questionId: answer.questionId,
        value: answer.getValue(),
        createdAt: answer.createdAt
      })),
      files: submission.files.map(file => ({
        id: file.id,
        stepId: file.stepId,
        questionId: file.questionId,
        fileName: file.fileName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        fileType: file.getFileType(),
        synced: file.isSynced(),
        createdAt: file.createdAt
      })),
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt
    };
  }
}
