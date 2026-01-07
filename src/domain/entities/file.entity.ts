import { SyncStatus } from '../value-objects/sync-status.vo';

export class File {
  constructor(
    public readonly id: string,
    public readonly submissionId: string,
    public readonly stepId: string,
    public readonly questionId: string | null,
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
    questionId: string | null = null,
    localPath: string | null = null
  ): File {
    return new File(
      id,
      submissionId,
      stepId,
      questionId,
      localPath,
      null,
      fileName,
      fileSize,
      mimeType,
      SyncStatus.PENDING,
      new Date()
    );
  }

  markAsSynced(remotePath: string): File {
    return new File(
      this.id,
      this.submissionId,
      this.stepId,
      this.questionId,
      this.localPath,
      remotePath,
      this.fileName,
      this.fileSize,
      this.mimeType,
      SyncStatus.SYNCED,
      this.createdAt
    );
  }

  markAsFailed(): File {
    return new File(
      this.id,
      this.submissionId,
      this.stepId,
      this.questionId,
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

  isValidFile(): boolean {
    return (
      this.fileName.trim().length > 0 &&
      this.fileSize > 0 &&
      this.mimeType.trim().length > 0
    );
  }

  isImage(): boolean {
    const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return imageMimeTypes.includes(this.mimeType.toLowerCase());
  }

  isVideo(): boolean {
    return this.mimeType.toLowerCase().startsWith('video/');
  }

  isPDF(): boolean {
    return this.mimeType.toLowerCase() === 'application/pdf';
  }

  getExtension(): string {
    const parts = this.fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  getFileType(): 'image' | 'video' | 'pdf' | 'other' {
    if (this.isImage()) return 'image';
    if (this.isVideo()) return 'video';
    if (this.isPDF()) return 'pdf';
    return 'other';
  }
}
