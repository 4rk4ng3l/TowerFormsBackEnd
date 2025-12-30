export enum SyncStatus {
  PENDING = 'pending',
  SYNCING = 'syncing',
  SYNCED = 'synced',
  FAILED = 'failed'
}

export class SyncStatusVO {
  private constructor(private readonly value: SyncStatus) {}

  static fromBoolean(synced: boolean): SyncStatusVO {
    return new SyncStatusVO(synced ? SyncStatus.SYNCED : SyncStatus.PENDING);
  }

  static fromString(status: string): SyncStatusVO {
    const lowerStatus = status.toLowerCase();

    if (!Object.values(SyncStatus).includes(lowerStatus as SyncStatus)) {
      throw new Error(`Invalid sync status: ${status}`);
    }

    return new SyncStatusVO(lowerStatus as SyncStatus);
  }

  static pending(): SyncStatusVO {
    return new SyncStatusVO(SyncStatus.PENDING);
  }

  static syncing(): SyncStatusVO {
    return new SyncStatusVO(SyncStatus.SYNCING);
  }

  static synced(): SyncStatusVO {
    return new SyncStatusVO(SyncStatus.SYNCED);
  }

  static failed(): SyncStatusVO {
    return new SyncStatusVO(SyncStatus.FAILED);
  }

  getValue(): SyncStatus {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  toBoolean(): boolean {
    return this.value === SyncStatus.SYNCED;
  }

  equals(other: SyncStatusVO): boolean {
    return this.value === other.value;
  }

  isPending(): boolean {
    return this.value === SyncStatus.PENDING;
  }

  isSyncing(): boolean {
    return this.value === SyncStatus.SYNCING;
  }

  isSynced(): boolean {
    return this.value === SyncStatus.SYNCED;
  }

  isFailed(): boolean {
    return this.value === SyncStatus.FAILED;
  }

  canRetry(): boolean {
    return this.value === SyncStatus.PENDING || this.value === SyncStatus.FAILED;
  }
}
