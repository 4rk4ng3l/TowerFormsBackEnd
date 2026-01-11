import { v4 as uuidv4 } from 'uuid';
import { ICommand } from '@shared/interfaces/command-handler.interface';

export class ExportStepImagesCommand implements ICommand {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly submissionId: string,
    public readonly stepNumber: number
  ) {
    this.commandId = uuidv4();
    this.timestamp = new Date();
  }
}
