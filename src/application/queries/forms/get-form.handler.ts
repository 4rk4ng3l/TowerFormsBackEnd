import { injectable, inject } from 'tsyringe';
import { IQueryHandler } from '@shared/interfaces/query-handler.interface';
import { GetFormQuery } from './get-form.query';
import { IFormRepository } from '@domain/repositories/form.repository.interface';
import { Form } from '@domain/entities/form.entity';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { logger } from '@shared/utils/logger';

@injectable()
export class GetFormHandler implements IQueryHandler<GetFormQuery, Form> {
  constructor(
    @inject('IFormRepository') private readonly formRepository: IFormRepository
  ) {}

  async handle(query: GetFormQuery): Promise<Form> {
    logger.debug('Getting form', { queryId: query.queryId, formId: query.formId });

    const form = await this.formRepository.findById(query.formId);

    if (!form) {
      logger.warn('Form not found', { formId: query.formId });
      throw NotFoundException.form(query.formId);
    }

    logger.debug('Form retrieved successfully', { formId: form.id });
    return form;
  }
}
