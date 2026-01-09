import { injectable, inject } from 'tsyringe';
import { IQueryHandler } from '@shared/interfaces/query-handler.interface';
import { ListFormsQuery } from './list-forms.query';
import { IFormRepository } from '@domain/repositories/form.repository.interface';
import { Form } from '@domain/entities/form.entity';
import { logger } from '@shared/utils/logger';

@injectable()
export class ListFormsHandler implements IQueryHandler<ListFormsQuery, Form[]> {
  constructor(
    @inject('IFormRepository') private readonly formRepository: IFormRepository
  ) {}

  async handle(query: ListFormsQuery): Promise<Form[]> {
    logger.debug('Listing all forms', { queryId: query.queryId });

    const forms = await this.formRepository.findAll();

    logger.debug('Forms retrieved successfully', { count: forms.length });
    return forms;
  }
}
