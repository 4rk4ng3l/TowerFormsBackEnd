import { FormStep } from './form-step.entity';

export class Form {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly version: number,
    public readonly steps: FormStep[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    id: string,
    name: string,
    description: string | null,
    version: number = 1
  ): Form {
    return new Form(
      id,
      name,
      description,
      version,
      [],
      new Date(),
      new Date()
    );
  }

  addStep(step: FormStep): Form {
    return new Form(
      this.id,
      this.name,
      this.description,
      this.version,
      [...this.steps, step],
      this.createdAt,
      this.updatedAt
    );
  }

  updateVersion(): Form {
    return new Form(
      this.id,
      this.name,
      this.description,
      this.version + 1,
      this.steps,
      this.createdAt,
      new Date()
    );
  }

  getTotalQuestions(): number {
    return this.steps.reduce((total, step) => total + step.questions.length, 0);
  }

  isValid(): boolean {
    return (
      this.name.trim().length > 0 &&
      this.steps.length > 0 &&
      this.steps.every(step => step.isValid())
    );
  }
}
