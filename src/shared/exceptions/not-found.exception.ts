import { BaseException } from './base.exception';

export class NotFoundException extends BaseException {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`, 'NOT_FOUND');
    this.name = 'NotFoundException';
  }

  static form(id: string): NotFoundException {
    return new NotFoundException('Form', id);
  }

  static submission(id: string): NotFoundException {
    return new NotFoundException('Submission', id);
  }

  static image(id: string): NotFoundException {
    return new NotFoundException('Image', id);
  }

  static question(id: string): NotFoundException {
    return new NotFoundException('Question', id);
  }
}
