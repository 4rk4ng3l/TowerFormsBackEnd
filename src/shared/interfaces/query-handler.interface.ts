export interface IQuery {
  readonly queryId: string;
  readonly timestamp: Date;
}

export interface IQueryHandler<TQuery extends IQuery, TResult> {
  handle(query: TQuery): Promise<TResult>;
}
