import { Form } from '../entities/form.entity';

export interface IFormRepository {
  /**
   * Find a form by its ID
   */
  findById(id: string): Promise<Form | null>;

  /**
   * Find all forms
   */
  findAll(): Promise<Form[]>;

  /**
   * Create a new form
   */
  create(form: Form): Promise<Form>;

  /**
   * Update an existing form
   */
  update(form: Form): Promise<Form>;

  /**
   * Delete a form by its ID
   */
  delete(id: string): Promise<void>;

  /**
   * Find forms by version
   */
  findByVersion(version: number): Promise<Form[]>;

  /**
   * Check if a form exists
   */
  exists(id: string): Promise<boolean>;
}
