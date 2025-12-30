export class ImageUploadedEvent {
  public readonly occurredOn: Date;

  constructor(
    public readonly imageId: string,
    public readonly submissionId: string,
    public readonly remotePath: string,
    public readonly fileSize: number
  ) {
    this.occurredOn = new Date();
  }

  toJSON() {
    return {
      eventType: 'ImageUploaded',
      imageId: this.imageId,
      submissionId: this.submissionId,
      remotePath: this.remotePath,
      fileSize: this.fileSize,
      occurredOn: this.occurredOn.toISOString()
    };
  }
}
