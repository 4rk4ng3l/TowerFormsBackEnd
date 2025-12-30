import { Image } from '../entities/image.entity';

export interface IImageRepository {
  /**
   * Find an image by its ID
   */
  findById(id: string): Promise<Image | null>;

  /**
   * Find all images for a specific submission
   */
  findBySubmissionId(submissionId: string): Promise<Image[]>;

  /**
   * Find all images for a specific step
   */
  findByStepId(stepId: string): Promise<Image[]>;

  /**
   * Find all unsynced images
   */
  findUnsynced(): Promise<Image[]>;

  /**
   * Create a new image record
   */
  create(image: Image): Promise<Image>;

  /**
   * Update an existing image record
   */
  update(image: Image): Promise<Image>;

  /**
   * Delete an image by its ID
   */
  delete(id: string): Promise<void>;

  /**
   * Mark an image as synced
   */
  markAsSynced(id: string, remotePath: string): Promise<Image>;

  /**
   * Mark an image as failed
   */
  markAsFailed(id: string): Promise<Image>;
}
