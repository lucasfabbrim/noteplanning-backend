import { logger, env } from '@/config';

export class LoggerHelper {
  static info(className: string, method: string, message: string, data?: any) {
    if (env.NODE_ENV === 'development') {
      logger.info({
        class: className,
        method,
        ...(data && { data }),
      }, message);
    }
  }

  static warn(className: string, method: string, message: string, data?: any) {
    logger.warn({
      class: className,
      method,
      ...(data && { data }),
    }, message);
  }

  static error(className: string, method: string, message: string, error?: any) {
    const errorData: any = {
      class: className,
      method,
    };

    if (env.NODE_ENV === 'development' && error) {
      errorData.error = error instanceof Error ? error.message : error;
    }

    logger.error(errorData, message);
  }

  static db(className: string, method: string, operation: string, entity: string) {
    // Disabled in production to save resources
    if (env.NODE_ENV === 'development') {
      logger.debug({
        class: className,
        method,
        operation,
        entity,
      }, `DB ${operation}: ${entity}`);
    }
  }

  static auth(method: string, event: string, data?: any) {
    // Only log auth errors in production
    if (env.NODE_ENV === 'development') {
      logger.info({
        class: 'AuthService',
        method,
        event,
        ...(data && { data }),
      }, `Auth: ${event}`);
    }
  }

  static webhook(source: string, event: string, data?: any) {
    // Only log webhook errors in production
    if (env.NODE_ENV === 'development') {
      logger.info({
        class: 'WebhookHandler',
        source,
        event,
        ...(data && { data }),
      }, `Webhook: ${source} - ${event}`);
    }
  }
}

