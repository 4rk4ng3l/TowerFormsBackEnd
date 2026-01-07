import { ICommand } from '@shared/interfaces/command-handler.interface';
import { v4 as uuidv4 } from 'uuid';

export class LogoutCommand implements ICommand {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly userId: string,
    public readonly refreshToken?: string
  ) {
    this.commandId = uuidv4();
    this.timestamp = new Date();
  }
}
