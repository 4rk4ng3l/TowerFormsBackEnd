export interface ICommand {
  readonly commandId: string;
  readonly timestamp: Date;
}

export interface ICommandHandler<TCommand extends ICommand, TResult = void> {
  handle(command: TCommand): Promise<TResult>;
}
