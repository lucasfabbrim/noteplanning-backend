/**
 * Password generation utilities
 */
export class PasswordHelper {
  /**
   * Generate a random password
   */
  static generateRandomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  /**
   * Generate a simple random password (only letters and numbers)
   */
  static generateSimplePassword(length: number = 6): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  /**
   * Generate a unique password with timestamp and random chars
   */
  static generateUniquePassword(): string {
    const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
    const randomChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomPart = '';
    
    // Generate 4 random characters
    for (let i = 0; i < 4; i++) {
      randomPart += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    
    // Combine timestamp + random chars for uniqueness
    return timestamp + randomPart;
  }
}
