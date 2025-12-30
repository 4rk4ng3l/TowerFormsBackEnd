import { Form } from '../entities/form.entity';
import { Question } from '../entities/question.entity';
import { Answer } from '../entities/answer.entity';
import { Submission } from '../entities/submission.entity';

export class AnswerValidationService {
  validateSubmission(form: Form, submission: Submission): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (form.id !== submission.formId) {
      errors.push('Submission does not match the form');
      return { isValid: false, errors };
    }

    const allQuestions = this.getAllQuestions(form);
    const requiredQuestions = allQuestions.filter(q => q.isRequired);

    requiredQuestions.forEach(question => {
      const answer = submission.answers.find(a => a.questionId === question.id);
      if (!answer) {
        errors.push(`Required question "${question.questionText}" has no answer`);
      } else {
        const validationErrors = this.validateAnswer(question, answer);
        errors.push(...validationErrors);
      }
    });

    submission.answers.forEach(answer => {
      const question = allQuestions.find(q => q.id === answer.questionId);
      if (!question) {
        errors.push(`Answer references non-existent question with ID: ${answer.questionId}`);
      } else {
        const validationErrors = this.validateAnswer(question, answer);
        errors.push(...validationErrors);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateAnswer(question: Question, answer: Answer): string[] {
    const errors: string[] = [];

    if (!answer.isValid()) {
      errors.push(`Answer for question "${question.questionText}" is invalid`);
      return errors;
    }

    const answerValue = answer.getValue();

    if (question.isMultipleChoice()) {
      if (answer.isTextAnswer()) {
        errors.push(`Question "${question.questionText}" expects a choice answer, but received text`);
      } else if (Array.isArray(answerValue)) {
        const invalidChoices = answerValue.filter(choice => !question.options?.includes(choice));
        if (invalidChoices.length > 0) {
          errors.push(
            `Invalid choice(s) for question "${question.questionText}": ${invalidChoices.join(', ')}`
          );
        }
      } else {
        const isValidChoice = question.options?.includes(answerValue as string);
        if (!isValidChoice) {
          errors.push(`Invalid choice for question "${question.questionText}": ${answerValue}`);
        }
      }
    } else {
      if (!answer.isTextAnswer()) {
        errors.push(`Question "${question.questionText}" expects a text answer, but received choices`);
      }
    }

    return errors;
  }

  private getAllQuestions(form: Form): Question[] {
    return form.steps.flatMap(step => step.questions);
  }

  validateCompleteness(form: Form, answers: Answer[]): { isComplete: boolean; missingRequired: string[] } {
    const allQuestions = this.getAllQuestions(form);
    const requiredQuestions = allQuestions.filter(q => q.isRequired);
    const answeredQuestionIds = answers.map(a => a.questionId);

    const missingRequired = requiredQuestions
      .filter(q => !answeredQuestionIds.includes(q.id))
      .map(q => q.questionText);

    return {
      isComplete: missingRequired.length === 0,
      missingRequired
    };
  }
}
