import { injectable, inject } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import { ICommandHandler } from '@shared/interfaces/command-handler.interface';
import { UpdateSubmissionCommand } from './update-submission.command';
import { Submission } from '@domain/entities/submission.entity';
import { Answer } from '@domain/entities/answer.entity';
import { AnswerValue } from '@domain/value-objects/answer-value.vo';
import { ISubmissionRepository } from '@domain/repositories/submission.repository.interface';
import { NotFoundException } from '@shared/exceptions/not-found.exception';

@injectable()
export class UpdateSubmissionHandler implements ICommandHandler<UpdateSubmissionCommand, Submission> {
  constructor(
    @inject('ISubmissionRepository') private readonly submissionRepository: ISubmissionRepository
  ) {}

  async handle(command: UpdateSubmissionCommand): Promise<Submission> {
    // Find existing submission
    let submission = await this.submissionRepository.findById(command.submissionId);
    if (!submission) {
      throw NotFoundException.form(`Submission with ID '${command.submissionId}' not found`);
    }

    // Update metadata if provided
    if (command.metadata) {
      submission = submission.updateMetadata(command.metadata);
    }

    // Add answers
    for (const answerDto of command.answers) {
      let answerValue: AnswerValue;

      if (answerDto.answerText) {
        answerValue = AnswerValue.fromText(answerDto.answerText);
      } else if (answerDto.answerValue) {
        if (answerDto.answerValue.length === 1) {
          answerValue = AnswerValue.fromSingleChoice(answerDto.answerValue[0]);
        } else {
          answerValue = AnswerValue.fromMultipleChoice(answerDto.answerValue);
        }
      } else {
        continue; // Skip if no answer provided
      }

      const answer = Answer.create(
        uuidv4(),
        submission.id,
        answerDto.questionId,
        answerValue
      );

      submission = submission.addAnswer(answer);
    }

    // Save to database
    const updatedSubmission = await this.submissionRepository.update(submission);

    return updatedSubmission;
  }
}
