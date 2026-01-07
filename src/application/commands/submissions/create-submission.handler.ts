import { injectable, inject } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import { ICommandHandler } from '@shared/interfaces/command-handler.interface';
import { CreateSubmissionCommand } from './create-submission.command';
import { Submission } from '@domain/entities/submission.entity';
import { ISubmissionRepository } from '@domain/repositories/submission.repository.interface';
import { IFormRepository } from '@domain/repositories/form.repository.interface';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { NotFoundException } from '@shared/exceptions/not-found.exception';

@injectable()
export class CreateSubmissionHandler implements ICommandHandler<CreateSubmissionCommand, Submission> {
  constructor(
    @inject('ISubmissionRepository') private readonly submissionRepository: ISubmissionRepository,
    @inject('IFormRepository') private readonly formRepository: IFormRepository,
    @inject('IUserRepository') private readonly userRepository: IUserRepository
  ) {}

  async handle(command: CreateSubmissionCommand): Promise<Submission> {
    // Verify form exists
    const formExists = await this.formRepository.exists(command.formId);
    if (!formExists) {
      throw NotFoundException.form(`Form with ID '${command.formId}' not found`);
    }

    // Verify user exists
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw NotFoundException.form(`User with ID '${command.userId}' not found`);
    }

    // Create submission entity
    const submission = Submission.create(
      uuidv4(),
      command.formId,
      command.userId,
      command.metadata || null
    );

    // Save to database
    const createdSubmission = await this.submissionRepository.create(submission);

    return createdSubmission;
  }
}
