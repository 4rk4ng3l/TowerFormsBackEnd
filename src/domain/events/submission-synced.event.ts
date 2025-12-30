export class SubmissionSyncedEvent {
  public readonly occurredOn: Date;

  constructor(
    public readonly submissionId: string,
    public readonly formId: string,
    public readonly syncedAt: Date
  ) {
    this.occurredOn = new Date();
  }

  toJSON() {
    return {
      eventType: 'SubmissionSynced',
      submissionId: this.submissionId,
      formId: this.formId,
      syncedAt: this.syncedAt.toISOString(),
      occurredOn: this.occurredOn.toISOString()
    };
  }
}
