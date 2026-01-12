import { FormStep } from './form-step.entity';

export interface FormMetadataSchema {
  [key: string]: {
    type: 'text' | 'select' | 'number' | 'date' | 'time';
    required: boolean;
    label: string;
    options?: string[];
  };
}

export type SiteType = 'GREENFIELD' | 'ROOFTOP' | 'POSTEVIA';

export class Form {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly siteId: string | null,
    public readonly siteType: SiteType,
    public readonly version: number,
    public readonly metadataSchema: FormMetadataSchema | null,
    public readonly steps: FormStep[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    id: string,
    name: string,
    description: string | null,
    siteId: string | null = null,
    siteType: SiteType = 'GREENFIELD',
    version: number = 1,
    metadataSchema: FormMetadataSchema | null = null
  ): Form {
    return new Form(
      id,
      name,
      description,
      siteId,
      siteType,
      version,
      metadataSchema,
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
      this.siteId,
      this.siteType,
      this.version,
      this.metadataSchema,
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
      this.siteId,
      this.siteType,
      this.version + 1,
      this.metadataSchema,
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
