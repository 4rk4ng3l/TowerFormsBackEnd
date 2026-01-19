import { injectable, inject } from 'tsyringe';
import { IQueryHandler } from '@shared/interfaces/query-handler.interface';
import { ListSubmissionsQuery } from './list-submissions.query';
import { ISubmissionRepository } from '@domain/repositories/submission.repository.interface';
import { Submission, SubmissionMetadata } from '@domain/entities/submission.entity';

export interface SubmissionListItem {
  id: string;
  formId: string;
  userId: string | null;
  metadata: SubmissionMetadata | null;
  startedAt: Date;
  completedAt: Date | null;
  synced: boolean;
  syncedAt: Date | null;
  answersCount: number;
  filesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

@injectable()
export class ListSubmissionsHandler implements IQueryHandler<ListSubmissionsQuery, SubmissionListItem[]> {
  constructor(
    @inject('ISubmissionRepository') private readonly submissionRepository: ISubmissionRepository
  ) {}

  async handle(query: ListSubmissionsQuery): Promise<SubmissionListItem[]> {
    let submissions: Submission[];

    if (query.formId) {
      submissions = await this.submissionRepository.findByFormId(query.formId);
    } else if (query.userId) {
      submissions = await this.submissionRepository.findByUserId(query.userId);
    } else {
      // No filter - return all submissions (for admin users)
      submissions = await this.submissionRepository.findAll();
    }

    return submissions.map((submission: Submission) => ({
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
