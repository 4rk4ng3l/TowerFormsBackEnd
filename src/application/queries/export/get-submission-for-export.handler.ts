import { injectable, inject } from 'tsyringe';
import { IQueryHandler } from '@shared/interfaces/query-handler.interface';
import { GetSubmissionForExportQuery } from './get-submission-for-export.query';
import { ISubmissionRepository } from '@domain/repositories/submission.repository.interface';
import { IFormRepository } from '@domain/repositories/form.repository.interface';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { NotFoundException } from '@shared/exceptions/not-found.exception';

export interface SubmissionForExport {
  submission: {
    id: string;
    formId: string;
    userId: string;
    metadata: any;
    startedAt: Date;
    completedAt: Date | null;
    synced: boolean;
    syncedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  form: {
    id: string;
    name: string;
    description: string | null;
    version: number;
    metadataSchema: any;
    steps: Array<{
      id: string;
      name: string;
      description: string | null;
      order: number;
      filePrefix: string | null;
      questions: Array<{
        id: string;
        text: string;
        description: string | null;
        type: string;
        required: boolean;
        options: string[] | null;
        order: number;
      }>;
    }>;
  };
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  answers: Array<{
    id: string;
    questionId: string;
    value: any;
    comment: string | null;
    createdAt: Date;
  }>;
  files: Array<{
    id: string;
    stepId: string;
    questionId: string | null;
    localPath: string | null;
    fileName: string;
    fileSize: number;
    mimeType: string;
    synced: boolean;
    createdAt: Date;
  }>;
}

@injectable()
export class GetSubmissionForExportHandler
  implements IQueryHandler<GetSubmissionForExportQuery, SubmissionForExport>
{
  constructor(
    @inject('ISubmissionRepository') private readonly submissionRepository: ISubmissionRepository,
    @inject('IFormRepository') private readonly formRepository: IFormRepository,
    @inject('IUserRepository') private readonly userRepository: IUserRepository
  ) {}

  async handle(query: GetSubmissionForExportQuery): Promise<SubmissionForExport> {
    // Get submission
    const submission = await this.submissionRepository.findById(query.submissionId);
    if (!submission) {
      throw NotFoundException.form(`Submission with ID '${query.submissionId}' not found`);
    }

    // Get form
    const form = await this.formRepository.findById(submission.formId);
    if (!form) {
      throw NotFoundException.form(`Form with ID '${submission.formId}' not found`);
    }

    // Get user (userId can be null)
    let user = null;
    if (submission.userId) {
      user = await this.userRepository.findById(submission.userId);
    }

    return {
      submission: {
        id: submission.id,
        formId: submission.formId,
        userId: submission.userId || 'anonymous',
        metadata: submission.metadata,
        startedAt: submission.startedAt,
        completedAt: submission.completedAt,
        synced: submission.isSynced(),
        syncedAt: submission.syncedAt,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt
      },
      form: {
        id: form.id,
        name: form.name,
        description: form.description,
        version: form.version,
        metadataSchema: form.metadataSchema,
        steps: form.steps.map(step => ({
          id: step.id,
          name: step.title,
          description: null,
          order: step.stepNumber,
          filePrefix: step.filePrefix,
          questions: step.questions.map(q => ({
            id: q.id,
            text: q.questionText,
            description: q.questionDescription,
            type: q.type.toString(),
            required: q.isRequired,
            options: q.options,
            order: q.orderNumber
          }))
        }))
      },
      user: user ? {
        id: user.id,
        email: user.email.getValue(),
        firstName: user.firstName,
        lastName: user.lastName
      } : {
        id: 'anonymous',
        email: 'anonymous@towerforms.com',
        firstName: 'Anonymous',
        lastName: 'User'
      },
      answers: submission.answers.map(answer => ({
        id: answer.id,
        questionId: answer.questionId,
        value: answer.getValue(),
        comment: answer.comment,
        createdAt: answer.createdAt
      })),
      files: submission.files.map(file => ({
        id: file.id,
        stepId: file.stepId,
        questionId: file.questionId || null,
        localPath: file.localPath || null,
        fileName: file.fileName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        synced: file.isSynced(),
        createdAt: file.createdAt
      }))
    };
  }
}
