export class SubmissionCreatedEvent {
  public readonly occurredOn: Date;

  constructor(
    public readonly submissionId: string,
    public readonly formId: string,
    public readonly userId: string | null
  ) {
    this.occurredOn = new Date();
  }

  toJSON() {
    return {
      eventType: 'SubmissionCreated',
      submissionId: this.submissionId,
      formId: this.formId,
      userId: this.userId,
      occurredOn: this.occurredOn.toISOString()
    };
  }
}
