import { injectable, inject } from 'tsyringe';
import { ICommandHandler } from '@shared/interfaces/command-handler.interface';
import { CompleteSubmissionCommand } from './complete-submission.command';
import { Submission } from '@domain/entities/submission.entity';
import { ISubmissionRepository } from '@domain/repositories/submission.repository.interface';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { ValidationException } from '@shared/exceptions/validation.exception';

@injectable()
export class CompleteSubmissionHandler implements ICommandHandler<CompleteSubmissionCommand, Submission> {
  constructor(
    @inject('ISubmissionRepository') private readonly submissionRepository: ISubmissionRepository
  ) {}

  async handle(command: CompleteSubmissionCommand): Promise<Submission> {
    // Find existing submission
    let submission = await this.submissionRepository.findById(command.submissionId);
    if (!submission) {
      throw NotFoundException.form(`Submission with ID '${command.submissionId}' not found`);
    }

    // Check if already completed
    if (submission.isCompleted()) {
      throw ValidationException.fromErrors(['Submission is already completed']);
    }

    // Mark as completed
    submission = submission.complete();

    // Save to database
    const completedSubmission = await this.submissionRepository.update(submission);

    return completedSubmission;
  }
}
