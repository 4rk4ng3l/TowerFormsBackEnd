import { ICommand } from '@shared/interfaces/command-handler.interface';
import { v4 as uuidv4 } from 'uuid';

export class RegisterUserCommand implements ICommand {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly roleName: string = 'Técnico de Campo'
  ) {
    this.commandId = uuidv4();
    this.timestamp = new Date();
  }
}
