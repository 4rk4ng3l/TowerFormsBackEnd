import { v4 as uuidv4 } from 'uuid';
import { ICommand } from '@shared/interfaces/command-handler.interface';

export class UpdateUserStatusCommand implements ICommand {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly userId: string,
    public readonly status: 'ACTIVE' | 'INACTIVE'
  ) {
    this.commandId = uuidv4();
    this.timestamp = new Date();
  }
}
