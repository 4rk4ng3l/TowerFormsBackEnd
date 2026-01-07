import { Answer } from './answer.entity';
import { File } from './file.entity';
import { SyncStatus } from '../value-objects/sync-status.vo';

export interface SubmissionMetadata {
  [key: string]: any;  // Flexible metadata based on Form's metadataSchema
}

export class Submission {
  constructor(
    public readonly id: string,
    public readonly formId: string,
    public readonly userId: string | null,
    public readonly metadata: SubmissionMetadata | null,
    public readonly startedAt: Date,
    public readonly completedAt: Date | null,
    public readonly syncStatus: SyncStatus,
    public readonly syncedAt: Date | null,
    public readonly answers: Answer[],
    public readonly files: File[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    id: string,
    formId: string,
    userId: string | null,
    metadata: SubmissionMetadata | null = null
  ): Submission {
    return new Submission(
      id,
      formId,
      userId,
      metadata,
      new Date(),
      null,
      SyncStatus.PENDING,
      null,
      [],
      [],
      new Date(),
      new Date()
    );
  }

  addAnswer(answer: Answer): Submission {
    return new Submission(
      this.id,
      this.formId,
      this.userId,
      this.metadata,
      this.startedAt,
      this.completedAt,
      this.syncStatus,
      this.syncedAt,
      [...this.answers, answer],
      this.files,
      this.createdAt,
      new Date()
    );
  }

  addFile(file: File): Submission {
    return new Submission(
      this.id,
      this.formId,
      this.userId,
      this.metadata,
      this.startedAt,
      this.completedAt,
      this.syncStatus,
      this.syncedAt,
      this.answers,
      [...this.files, file],
      this.createdAt,
      new Date()
    );
  }

  updateMetadata(metadata: SubmissionMetadata): Submission {
    return new Submission(
      this.id,
      this.formId,
      this.userId,
      metadata,
      this.startedAt,
      this.completedAt,
      this.syncStatus,
      this.syncedAt,
      this.answers,
      this.files,
      this.createdAt,
      new Date()
    );
  }

  complete(): Submission {
    return new Submission(
      this.id,
      this.formId,
      this.userId,
      this.metadata,
      this.startedAt,
      new Date(),
      this.syncStatus,
      this.syncedAt,
      this.answers,
      this.files,
      this.createdAt,
      new Date()
    );
  }

  markAsSynced(): Submission {
    return new Submission(
      this.id,
      this.formId,
      this.userId,
      this.metadata,
      this.startedAt,
      this.completedAt,
      SyncStatus.SYNCED,
      new Date(),
      this.answers,
      this.files,
      this.createdAt,
      new Date()
    );
  }

  markAsFailed(): Submission {
    return new Submission(
      this.id,
      this.formId,
      this.userId,
      this.metadata,
      this.startedAt,
      this.completedAt,
      SyncStatus.FAILED,
      null,
      this.answers,
      this.files,
      this.createdAt,
      new Date()
    );
  }

  isCompleted(): boolean {
    return this.completedAt !== null;
  }

  isSynced(): boolean {
    return this.syncStatus === SyncStatus.SYNCED;
  }

  needsSync(): boolean {
    return this.isCompleted() && !this.isSynced();
  }
}
