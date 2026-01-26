import { v4 as uuidv4 } from 'uuid';
import { ICommand } from '@shared/interfaces/command-handler.interface';

export class AddFileToSubmissionCommand implements ICommand {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly submissionId: string,
    public readonly stepId: string,
    public readonly questionId: string | null,
    public readonly fileName: string,
    public readonly filePath: string,
    public readonly fileSize: number,
    public readonly mimeType: string,
    public readonly fileId?: string // Optional: use client-provided ID for sync
  ) {
    this.commandId = uuidv4();
    this.timestamp = new Date();
  }
}
