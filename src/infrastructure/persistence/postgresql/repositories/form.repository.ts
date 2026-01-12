import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { IFormRepository } from '@domain/repositories/form.repository.interface';
import { Form, FormMetadataSchema, SiteType } from '@domain/entities/form.entity';
import { FormStep } from '@domain/entities/form-step.entity';
import { Question, QuestionMetadata } from '@domain/entities/question.entity';
import { QuestionType } from '@domain/value-objects/question-type.vo';

@injectable()
export class FormRepository implements IFormRepository {
  constructor(
    @inject('PrismaClient') private readonly prisma: PrismaClient
  ) {}

  async findById(id: string): Promise<Form | null> {
    const formData = await this.prisma.form.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
          include: {
            questions: {
              orderBy: { orderNumber: 'asc' }
            }
          }
        }
      }
    });

    if (!formData) {
      return null;
    }

    return this.toDomain(formData);
  }

  async findAll(): Promise<Form[]> {
    const forms = await this.prisma.form.findMany({
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
          include: {
            questions: {
              orderBy: { orderNumber: 'asc' }
            }
          }
        }
      }
    });

    return forms.map(form => this.toDomain(form));
  }

  async create(form: Form): Promise<Form> {
    const created = await this.prisma.form.create({
      data: this.toPersistence(form),
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
          include: {
            questions: {
              orderBy: { orderNumber: 'asc' }
            }
          }
        }
      }
    });

    return this.toDomain(created);
  }

  async update(form: Form): Promise<Form> {
    const updated = await this.prisma.form.update({
      where: { id: form.id },
      data: {
        name: form.name,
        description: form.description,
        siteId: form.siteId,
        siteType: form.siteType,
        version: form.version,
        metadataSchema: form.metadataSchema as any,
        updatedAt: form.updatedAt
      },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
          include: {
            questions: {
              orderBy: { orderNumber: 'asc' }
            }
          }
        }
      }
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.form.delete({
      where: { id }
    });
  }

  async findByVersion(version: number): Promise<Form[]> {
    const forms = await this.prisma.form.findMany({
      where: { version },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
          include: {
            questions: {
              orderBy: { orderNumber: 'asc' }
            }
          }
        }
      }
    });

    return forms.map(form => this.toDomain(form));
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.form.count({
      where: { id }
    });

    return count > 0;
  }

  private toDomain(data: any): Form {
    const steps = data.steps?.map((stepData: any) => {
      const questions = stepData.questions?.map((questionData: any) => {
        return new Question(
          questionData.id,
          questionData.stepId,
          questionData.questionText,
          questionData.type as QuestionType,
          questionData.options ? JSON.parse(JSON.stringify(questionData.options)) : null,
          questionData.isRequired,
          questionData.orderNumber,
          questionData.metadata as QuestionMetadata | null,
          new Date(questionData.createdAt)
        );
      }) || [];

      return new FormStep(
        stepData.id,
        stepData.formId,
        stepData.stepNumber,
        stepData.title,
        questions,
        new Date(stepData.createdAt)
      );
    }) || [];

    return new Form(
      data.id,
      data.name,
      data.description,
      data.siteId,
      data.siteType as SiteType,
      data.version,
      data.metadataSchema as FormMetadataSchema | null,
      steps,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }

  private toPersistence(form: Form): any {
    return {
      id: form.id,
      name: form.name,
      description: form.description,
      siteId: form.siteId,
      siteType: form.siteType,
      version: form.version,
      metadataSchema: form.metadataSchema as any,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt
    };
  }
}
