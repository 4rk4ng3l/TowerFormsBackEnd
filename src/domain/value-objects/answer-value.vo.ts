export class AnswerValue {
  private constructor(
    private readonly textValue: string | null,
    private readonly choiceValue: string[] | null
  ) {}

  static fromText(text: string): AnswerValue {
    if (!text || text.trim().length === 0) {
      throw new Error('Text answer cannot be empty');
    }
    return new AnswerValue(text.trim(), null);
  }

  static fromSingleChoice(choice: string): AnswerValue {
    if (!choice || choice.trim().length === 0) {
      throw new Error('Choice answer cannot be empty');
    }
    return new AnswerValue(null, [choice.trim()]);
  }

  static fromMultipleChoice(choices: string[]): AnswerValue {
    if (!choices || choices.length === 0) {
      throw new Error('Multiple choice answer must have at least one choice');
    }
    const trimmedChoices = choices.map(c => c.trim()).filter(c => c.length > 0);
    if (trimmedChoices.length === 0) {
      throw new Error('Multiple choice answer cannot have only empty choices');
    }
    return new AnswerValue(null, trimmedChoices);
  }

  static fromJson(json: any): AnswerValue {
    if (json.textValue !== undefined && json.textValue !== null) {
      return AnswerValue.fromText(json.textValue);
    }
    if (json.choiceValue !== undefined && json.choiceValue !== null) {
      if (Array.isArray(json.choiceValue)) {
        return json.choiceValue.length === 1
          ? AnswerValue.fromSingleChoice(json.choiceValue[0])
          : AnswerValue.fromMultipleChoice(json.choiceValue);
      }
    }
    throw new Error('Invalid answer value JSON');
  }

  isText(): boolean {
    return this.textValue !== null;
  }

  isChoice(): boolean {
    return this.choiceValue !== null;
  }

  isSingleChoice(): boolean {
    return this.choiceValue !== null && this.choiceValue.length === 1;
  }

  isMultipleChoice(): boolean {
    return this.choiceValue !== null && this.choiceValue.length > 1;
  }

  getValue(): string | string[] {
    if (this.isText()) {
      return this.textValue!;
    }
    if (this.isSingleChoice()) {
      return this.choiceValue![0];
    }
    return this.choiceValue!;
  }

  getTextValue(): string | null {
    return this.textValue;
  }

  getChoiceValue(): string[] | null {
    return this.choiceValue;
  }

  toJson(): { textValue: string | null; choiceValue: string[] | null } {
    return {
      textValue: this.textValue,
      choiceValue: this.choiceValue
    };
  }

  isValid(): boolean {
    if (this.isText()) {
      return this.textValue !== null && this.textValue.trim().length > 0;
    }
    if (this.isChoice()) {
      return this.choiceValue !== null && this.choiceValue.length > 0;
    }
    return false;
  }

  equals(other: AnswerValue): boolean {
    if (this.isText() && other.isText()) {
      return this.textValue === other.textValue;
    }
    if (this.isChoice() && other.isChoice()) {
      return JSON.stringify(this.choiceValue) === JSON.stringify(other.choiceValue);
    }
    return false;
  }
}
