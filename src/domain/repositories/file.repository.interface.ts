import { File } from '../entities/file.entity';

export interface IFileRepository {
  /**
   * Find a file by its ID
   */
  findById(id: string): Promise<File | null>;

  /**
   * Find all files for a specific submission
   */
  findBySubmissionId(submissionId: string): Promise<File[]>;

  /**
   * Find all files for a specific step
   */
  findByStepId(stepId: string): Promise<File[]>;

  /**
   * Find all unsynced files
   */
  findUnsynced(): Promise<File[]>;

  /**
   * Create a new file
   */
  create(file: File): Promise<File>;

  /**
   * Update an existing file
   */
  update(file: File): Promise<File>;

  /**
   * Delete a file by its ID
   */
  delete(id: string): Promise<void>;

  /**
   * Mark a file as synced
   */
  markAsSynced(id: string, remotePath: string): Promise<File>;

  /**
   * Mark a file as failed
   */
  markAsFailed(id: string): Promise<File>;

  /**
   * Count files by submission
   */
  countBySubmissionId(submissionId: string): Promise<number>;
}
