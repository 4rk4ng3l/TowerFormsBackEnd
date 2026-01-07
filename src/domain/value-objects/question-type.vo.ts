export enum QuestionType {
  TEXT = 'text',
  MULTIPLE_CHOICE = 'multiple_choice',
  SINGLE_CHOICE = 'single_choice',
  NUMBER = 'number',
  DATE = 'date',
  TIME = 'time',
  FILE_UPLOAD = 'file_upload'
}

export class QuestionTypeVO {
  private constructor(private readonly value: QuestionType) {}

  static fromString(type: string): QuestionTypeVO {
    const upperType = type.toLowerCase();

    if (!Object.values(QuestionType).includes(upperType as QuestionType)) {
      throw new Error(`Invalid question type: ${type}`);
    }

    return new QuestionTypeVO(upperType as QuestionType);
  }

  static text(): QuestionTypeVO {
    return new QuestionTypeVO(QuestionType.TEXT);
  }

  static multipleChoice(): QuestionTypeVO {
    return new QuestionTypeVO(QuestionType.MULTIPLE_CHOICE);
  }

  static singleChoice(): QuestionTypeVO {
    return new QuestionTypeVO(QuestionType.SINGLE_CHOICE);
  }

  static number(): QuestionTypeVO {
    return new QuestionTypeVO(QuestionType.NUMBER);
  }

  static date(): QuestionTypeVO {
    return new QuestionTypeVO(QuestionType.DATE);
  }

  static time(): QuestionTypeVO {
    return new QuestionTypeVO(QuestionType.TIME);
  }

  static fileUpload(): QuestionTypeVO {
    return new QuestionTypeVO(QuestionType.FILE_UPLOAD);
  }

  getValue(): QuestionType {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: QuestionTypeVO): boolean {
    return this.value === other.value;
  }

  isMultipleChoice(): boolean {
    return this.value === QuestionType.MULTIPLE_CHOICE || this.value === QuestionType.SINGLE_CHOICE;
  }
}
