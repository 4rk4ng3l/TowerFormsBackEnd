import { injectable, inject } from 'tsyringe';
import { IQueryHandler } from '@shared/interfaces/query-handler.interface';
import { GetFileQuery } from './get-file.query';
import { File } from '@domain/entities/file.entity';
import { IFileRepository } from '@domain/repositories/file.repository.interface';
import { NotFoundException } from '@shared/exceptions/not-found.exception';

@injectable()
export class GetFileHandler implements IQueryHandler<GetFileQuery, File> {
  constructor(
    @inject('IFileRepository') private readonly fileRepository: IFileRepository
  ) {}

  async handle(query: GetFileQuery): Promise<File> {
    const file = await this.fileRepository.findById(query.fileId);

    if (!file) {
      throw NotFoundException.form(`File with ID '${query.fileId}' not found`);
    }

    return file;
  }
}
