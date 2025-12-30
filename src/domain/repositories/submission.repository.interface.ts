import { Submission } from '../entities/submission.entity';

export interface ISubmissionRepository {
  /**
   * Find a submission by its ID
   */
  findById(id: string): Promise<Submission | null>;

  /**
   * Find all submissions for a specific form
   */
  findByFormId(formId: string): Promise<Submission[]>;

  /**
   * Find all submissions by user
   */
  findByUserId(userId: string): Promise<Submission[]>;

  /**
   * Find all unsynced submissions
   */
  findUnsynced(): Promise<Submission[]>;

  /**
   * Create a new submission
   */
  create(submission: Submission): Promise<Submission>;

  /**
   * Update an existing submission
   */
  update(submission: Submission): Promise<Submission>;

  /**
   * Delete a submission by its ID
   */
  delete(id: string): Promise<void>;

  /**
   * Mark a submission as synced
   */
  markAsSynced(id: string): Promise<Submission>;

  /**
   * Mark a submission as failed
   */
  markAsFailed(id: string): Promise<Submission>;

  /**
   * Count submissions by form
   */
  countByFormId(formId: string): Promise<number>;
}
