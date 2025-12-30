import { SyncStatus } from '../value-objects/sync-status.vo';

export class Image {
  constructor(
    public readonly id: string,
    public readonly submissionId: string,
    public readonly stepId: string,
    public readonly localPath: string | null,
    public readonly remotePath: string | null,
    public readonly fileName: string,
    public readonly fileSize: number,
    public readonly mimeType: string,
    public readonly syncStatus: SyncStatus,
    public readonly createdAt: Date
  ) {}

  static create(
    id: string,
    submissionId: string,
    stepId: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
    localPath: string | null = null
  ): Image {
    return new Image(
      id,
      submissionId,
      stepId,
      localPath,
      null,
      fileName,
      fileSize,
      mimeType,
      SyncStatus.PENDING,
      new Date()
    );
  }

  markAsSynced(remotePath: string): Image {
    return new Image(
      this.id,
      this.submissionId,
      this.stepId,
      this.localPath,
      remotePath,
      this.fileName,
      this.fileSize,
      this.mimeType,
      SyncStatus.SYNCED,
      this.createdAt
    );
  }

  markAsFailed(): Image {
    return new Image(
      this.id,
      this.submissionId,
      this.stepId,
      this.localPath,
      this.remotePath,
      this.fileName,
      this.fileSize,
      this.mimeType,
      SyncStatus.FAILED,
      this.createdAt
    );
  }

  isSynced(): boolean {
    return this.syncStatus === SyncStatus.SYNCED;
  }

  needsSync(): boolean {
    return this.syncStatus === SyncStatus.PENDING || this.syncStatus === SyncStatus.FAILED;
  }

  isValidImage(): boolean {
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    return (
      this.fileName.trim().length > 0 &&
      this.fileSize > 0 &&
      validMimeTypes.includes(this.mimeType.toLowerCase())
    );
  }

  getExtension(): string {
    const parts = this.fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }
}
