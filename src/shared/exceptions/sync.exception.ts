import { BaseException } from './base.exception';

export class SyncException extends BaseException {
  constructor(message: string, public readonly details?: any) {
    super(message, 'SYNC_ERROR');
    this.name = 'SyncException';
  }

  static submissionFailed(submissionId: string, reason: string): SyncException {
    return new SyncException(
      `Failed to sync submission ${submissionId}: ${reason}`,
      { submissionId, reason }
    );
  }

  static imageFailed(imageId: string, reason: string): SyncException {
    return new SyncException(
      `Failed to sync image ${imageId}: ${reason}`,
      { imageId, reason }
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      details: this.details
    };
  }
}
