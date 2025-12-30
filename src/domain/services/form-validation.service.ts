import { Form } from '../entities/form.entity';
import { FormStep } from '../entities/form-step.entity';
import { Question } from '../entities/question.entity';

export class FormValidationService {
  validateForm(form: Form): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!form.name || form.name.trim().length === 0) {
      errors.push('Form name is required');
    }

    if (form.name && form.name.length > 255) {
      errors.push('Form name must not exceed 255 characters');
    }

    if (form.steps.length === 0) {
      errors.push('Form must have at least one step');
    }

    form.steps.forEach((step, index) => {
      const stepErrors = this.validateStep(step, index + 1);
      errors.push(...stepErrors);
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateStep(step: FormStep, stepIndex: number): string[] {
    const errors: string[] = [];

    if (!step.title || step.title.trim().length === 0) {
      errors.push(`Step ${stepIndex}: Title is required`);
    }

    if (step.questions.length === 0) {
      errors.push(`Step ${stepIndex}: Must have at least one question`);
    }

    step.questions.forEach((question, qIndex) => {
      const questionErrors = this.validateQuestion(question, stepIndex, qIndex + 1);
      errors.push(...questionErrors);
    });

    return errors;
  }

  validateQuestion(question: Question, stepIndex: number, questionIndex: number): string[] {
    const errors: string[] = [];
    const prefix = `Step ${stepIndex}, Question ${questionIndex}`;

    if (!question.questionText || question.questionText.trim().length === 0) {
      errors.push(`${prefix}: Question text is required`);
    }

    if (question.requiresOptions() && (!question.options || question.options.length === 0)) {
      errors.push(`${prefix}: Multiple choice questions must have at least one option`);
    }

    if (question.options && question.options.length > 0 && question.options.length < 2) {
      errors.push(`${prefix}: Multiple choice questions must have at least 2 options`);
    }

    if (question.orderNumber <= 0) {
      errors.push(`${prefix}: Order number must be greater than 0`);
    }

    return errors;
  }

  validateStepOrder(steps: FormStep[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const stepNumbers = steps.map(s => s.stepNumber).sort((a, b) => a - b);

    for (let i = 0; i < stepNumbers.length; i++) {
      if (stepNumbers[i] !== i + 1) {
        errors.push(`Steps must be numbered sequentially starting from 1. Missing step ${i + 1}`);
        break;
      }
    }

    const duplicates = stepNumbers.filter((num, index) => stepNumbers.indexOf(num) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate step numbers found: ${duplicates.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateQuestionOrder(questions: Question[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const orderNumbers = questions.map(q => q.orderNumber).sort((a, b) => a - b);

    for (let i = 0; i < orderNumbers.length; i++) {
      if (orderNumbers[i] !== i + 1) {
        errors.push(`Questions must be numbered sequentially starting from 1. Missing order ${i + 1}`);
        break;
      }
    }

    const duplicates = orderNumbers.filter((num, index) => orderNumbers.indexOf(num) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate question order numbers found: ${duplicates.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
