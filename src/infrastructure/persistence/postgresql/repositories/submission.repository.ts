import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { ISubmissionRepository } from '@domain/repositories/submission.repository.interface';
import { Submission, SubmissionMetadata } from '@domain/entities/submission.entity';
import { Answer } from '@domain/entities/answer.entity';
import { File } from '@domain/entities/file.entity';
import { SyncStatus } from '@domain/value-objects/sync-status.vo';
import { AnswerValue } from '@domain/value-objects/answer-value.vo';

@injectable()
export class SubmissionRepository implements ISubmissionRepository {
  constructor(
    @inject('PrismaClient') private readonly prisma: PrismaClient
  ) {}

  async findById(id: string): Promise<Submission | null> {
    const submissionData = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        answers: true,
        files: true
      }
    });

    if (!submissionData) {
      return null;
    }

    return this.toDomain(submissionData);
  }

  async findByFormId(formId: string): Promise<Submission[]> {
    const submissions = await this.prisma.submission.findMany({
      where: { formId },
      include: {
        answers: true,
        files: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return submissions.map(submission => this.toDomain(submission));
  }

  async findByUserId(userId: string): Promise<Submission[]> {
    const submissions = await this.prisma.submission.findMany({
      where: { userId },
      include: {
        answers: true,
        files: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return submissions.map(submission => this.toDomain(submission));
  }

  async findUnsynced(): Promise<Submission[]> {
    const submissions = await this.prisma.submission.findMany({
      where: {
        syncStatus: {
          in: ['pending', 'failed']
        }
      },
      include: {
        answers: true,
        files: true
      }
    });

    return submissions.map(submission => this.toDomain(submission));
  }

  async create(submission: Submission): Promise<Submission> {
    const created = await this.prisma.submission.create({
      data: {
        id: submission.id,
        formId: submission.formId,
        userId: submission.userId,
        metadata: submission.metadata as any,
        startedAt: submission.startedAt,
        completedAt: submission.completedAt,
        syncStatus: submission.syncStatus.toString(),
        syncedAt: submission.syncedAt,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt
      },
      include: {
        answers: true,
        files: true
      }
    });

    return this.toDomain(created);
  }

  async update(submission: Submission): Promise<Submission> {
    // Update submission
    const updated = await this.prisma.submission.update({
      where: { id: submission.id },
      data: {
        metadata: submission.metadata as any,
        completedAt: submission.completedAt,
        syncStatus: submission.syncStatus.toString(),
        syncedAt: submission.syncedAt,
        updatedAt: submission.updatedAt
      },
      include: {
        answers: true,
        files: true
      }
    });

    // Update answers if needed
    // Delete existing answers
    await this.prisma.answer.deleteMany({
      where: { submissionId: submission.id }
    });

    // Create new answers
    if (submission.answers.length > 0) {
      await this.prisma.answer.createMany({
        data: submission.answers.map(answer => {
          const jsonValue = answer.value.toJson();
          return {
            id: answer.id,
            submissionId: answer.submissionId,
            questionId: answer.questionId,
            answerValue: jsonValue.choiceValue ? JSON.parse(JSON.stringify(jsonValue.choiceValue)) : null,
            answerText: jsonValue.textValue,
            createdAt: answer.createdAt
          };
        })
      });
    }

    // Update files if needed
    // Delete existing files
    await this.prisma.file.deleteMany({
      where: { submissionId: submission.id }
    });

    // Create new files
    if (submission.files.length > 0) {
      await this.prisma.file.createMany({
        data: submission.files.map(file => ({
          id: file.id,
          submissionId: file.submissionId,
          stepId: file.stepId,
          questionId: file.questionId,
          localPath: file.localPath,
          remotePath: file.remotePath,
          fileName: file.fileName,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          syncStatus: file.syncStatus.toString(),
          createdAt: file.createdAt
        }))
      });
    }

    // Fetch updated data
    const refreshed = await this.prisma.submission.findUnique({
      where: { id: submission.id },
      include: {
        answers: true,
        files: true
      }
    });

    return this.toDomain(refreshed!);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.submission.delete({
      where: { id }
    });
  }

  async markAsSynced(id: string): Promise<Submission> {
    const updated = await this.prisma.submission.update({
      where: { id },
      data: {
        syncStatus: 'synced',
        syncedAt: new Date()
      },
      include: {
        answers: true,
        files: true
      }
    });

    return this.toDomain(updated);
  }

  async markAsFailed(id: string): Promise<Submission> {
    const updated = await this.prisma.submission.update({
      where: { id },
      data: {
        syncStatus: 'failed',
        syncedAt: null
      },
      include: {
        answers: true,
        files: true
      }
    });

    return this.toDomain(updated);
  }

  async countByFormId(formId: string): Promise<number> {
    return this.prisma.submission.count({
      where: { formId }
    });
  }

  private toDomain(data: any): Submission {
    const syncStatus = data.syncStatus as SyncStatus;

    const answers = data.answers?.map((answerData: any) => {
      // Reconstruct AnswerValue from Prisma data
      const answerValue = answerData.answerText
        ? AnswerValue.fromText(answerData.answerText)
        : answerData.answerValue
        ? Array.isArray(answerData.answerValue) && answerData.answerValue.length === 1
          ? AnswerValue.fromSingleChoice(answerData.answerValue[0])
          : AnswerValue.fromMultipleChoice(answerData.answerValue)
        : AnswerValue.fromText(''); // Fallback, though this shouldn't happen

      return new Answer(
        answerData.id,
        answerData.submissionId,
        answerData.questionId,
        answerValue,
        new Date(answerData.createdAt)
      );
    }) || [];

    const files = data.files?.map((fileData: any) => {
      const fileSyncStatus = fileData.syncStatus as SyncStatus;

      return new File(
        fileData.id,
        fileData.submissionId,
        fileData.stepId,
        fileData.questionId,
        fileData.localPath,
        fileData.remotePath,
        fileData.fileName,
        fileData.fileSize,
        fileData.mimeType,
        fileSyncStatus,
        new Date(fileData.createdAt)
      );
    }) || [];

    return new Submission(
      data.id,
      data.formId,
      data.userId,
      data.metadata as SubmissionMetadata | null,
      new Date(data.startedAt),
      data.completedAt ? new Date(data.completedAt) : null,
      syncStatus,
      data.syncedAt ? new Date(data.syncedAt) : null,
      answers,
      files,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }
}
