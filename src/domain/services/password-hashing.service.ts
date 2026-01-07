import { injectable } from 'tsyringe';
import * as bcrypt from 'bcryptjs';

@injectable()
export class PasswordHashingService {
  private readonly saltRounds = 10;

  async hash(password: string): Promise<string> {
    if (!password || password.length === 0) {
      throw new Error('Password cannot be empty');
    }

    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      throw new Error(`Failed to hash password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verify(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      return false;
    }

    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      // Log error but don't expose it to caller
      console.error('Error verifying password:', error);
      return false;
    }
  }

  async needsRehash(hash: string): Promise<boolean> {
    try {
      // bcryptjs doesn't have a native way to check if rehashing is needed
      // This is a placeholder for future implementation
      // You could parse the hash to check the cost factor
      return false;
    } catch (error) {
      return false;
    }
  }
}
