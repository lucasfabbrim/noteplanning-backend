import { logger } from '@/config';

/**
 * Standardized logging helper with class/method context
 * Follows Java-like logging patterns with simplified class names
 */
export class LoggerHelper {
  /**
   * Log info message with context
   */
  static info(className: string, method: string, message: string, data?: any) {
    logger.info({
      class: className,
      method,
      ...(data && { data }),
    }, message);
  }

  /**
   * Log warning message with context
   */
  static warn(className: string, method: string, message: string, data?: any) {
    logger.warn({
      class: className,
      method,
      ...(data && { data }),
    }, message);
  }

  /**
   * Log error message with context (no stack trace in production)
   */
  static error(className: string, method: string, message: string, error?: any) {
    const errorData: any = {
      class: className,
      method,
    };

    // Only include error details in development
    if (process.env.NODE_ENV === 'development' && error) {
      errorData.error = error instanceof Error ? error.message : error;
    }

    logger.error(errorData, message);
  }

  /**
   * Log database operation
   */
  static db(className: string, method: string, operation: string, entity: string) {
    logger.debug({
      class: className,
      method,
      operation,
      entity,
    }, `DB ${operation}: ${entity}`);
  }

  /**
   * Log authentication event
   */
  static auth(method: string, event: string, data?: any) {
    logger.info({
      class: 'AuthService',
      method,
      event,
      ...(data && { data }),
    }, `Auth: ${event}`);
  }

  /**
   * Log webhook event
   */
  static webhook(source: string, event: string, data?: any) {
    logger.info({
      class: 'WebhookHandler',
      source,
      event,
      ...(data && { data }),
    }, `Webhook: ${source} - ${event}`);
  }
}

