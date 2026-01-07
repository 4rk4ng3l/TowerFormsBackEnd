import { injectable, inject } from 'tsyringe';
import { IQueryHandler } from '@shared/interfaces/query-handler.interface';
import { ListSubmissionsQuery } from './list-submissions.query';
import { ISubmissionRepository } from '@domain/repositories/submission.repository.interface';

@injectable()
export class ListSubmissionsHandler implements IQueryHandler<ListSubmissionsQuery, any[]> {
  constructor(
    @inject('ISubmissionRepository') private readonly submissionRepository: ISubmissionRepository
  ) {}

  async handle(query: ListSubmissionsQuery): Promise<any[]> {
    let submissions;

    if (query.formId) {
      submissions = await this.submissionRepository.findByFormId(query.formId);
    } else if (query.userId) {
      submissions = await this.submissionRepository.findByUserId(query.userId);
    } else {
      // If no filter, return empty array or implement findAll in repository
      submissions = [];
    }

    return submissions.map(submission => ({
      id: submission.id,
      formId: submission.formId,
      userId: submission.userId,
      metadata: submission.metadata,
      startedAt: submission.startedAt,
      completedAt: submission.completedAt,
      synced: submission.isSynced(),
      syncedAt: submission.syncedAt,
      answersCount: submission.answers.length,
      filesCount: submission.files.length,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt
    }));
  }
}
