import { v4 as uuidv4 } from 'uuid';
import { ICommand } from '@shared/interfaces/command-handler.interface';

export interface SyncSubmissionDto {
  id: string;
  formId: string;
  userId: string;
  metadata?: Record<string, any>;
  startedAt: string;
  completedAt?: string;
  answers: Array<{
    id: string;
    questionId: string;
    answerText?: string;
    answerValue?: string[];
    answerComment?: string;
  }>;
  files: Array<{
    id: string;
    stepId: string;
    questionId?: string;
    fileName: string;
    fileData: string; // Base64 encoded file
    mimeType: string;
    fileSize: number;
  }>;
}

export class SyncSubmissionsCommand implements ICommand {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly submissions: SyncSubmissionDto[]
  ) {
    this.commandId = uuidv4();
    this.timestamp = new Date();
  }
}
