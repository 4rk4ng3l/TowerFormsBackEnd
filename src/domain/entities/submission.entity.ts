import { Answer } from './answer.entity';
import { Image } from './image.entity';
import { SyncStatus } from '../value-objects/sync-status.vo';

export class Submission {
  constructor(
    public readonly id: string,
    public readonly formId: string,
    public readonly userId: string | null,
    public readonly startedAt: Date,
    public readonly completedAt: Date | null,
    public readonly syncStatus: SyncStatus,
    public readonly syncedAt: Date | null,
    public readonly answers: Answer[],
    public readonly images: Image[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    id: string,
    formId: string,
    userId: string | null
  ): Submission {
    return new Submission(
      id,
      formId,
      userId,
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
      this.startedAt,
      this.completedAt,
      this.syncStatus,
      this.syncedAt,
      [...this.answers, answer],
      this.images,
      this.createdAt,
      new Date()
    );
  }

  addImage(image: Image): Submission {
    return new Submission(
      this.id,
      this.formId,
      this.userId,
      this.startedAt,
      this.completedAt,
      this.syncStatus,
      this.syncedAt,
      this.answers,
      [...this.images, image],
      this.createdAt,
      new Date()
    );
  }

  complete(): Submission {
    return new Submission(
      this.id,
      this.formId,
      this.userId,
      this.startedAt,
      new Date(),
      this.syncStatus,
      this.syncedAt,
      this.answers,
      this.images,
      this.createdAt,
      new Date()
    );
  }

  markAsSynced(): Submission {
    return new Submission(
      this.id,
      this.formId,
      this.userId,
      this.startedAt,
      this.completedAt,
      SyncStatus.SYNCED,
      new Date(),
      this.answers,
      this.images,
      this.createdAt,
      new Date()
    );
  }

  markAsFailed(): Submission {
    return new Submission(
      this.id,
      this.formId,
      this.userId,
      this.startedAt,
      this.completedAt,
      SyncStatus.FAILED,
      null,
      this.answers,
      this.images,
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
