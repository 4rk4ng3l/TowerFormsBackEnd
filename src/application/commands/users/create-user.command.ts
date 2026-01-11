import { v4 as uuidv4 } from 'uuid';
import { ICommand } from '@shared/interfaces/command-handler.interface';

export class CreateUserCommand implements ICommand {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly roleName: string
  ) {
    this.commandId = uuidv4();
    this.timestamp = new Date();
  }
}
