import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '@/errors';
import { LoggerHelper } from '@/utils/logger.helper';

/**
 * Global error handler middleware
 */
export async function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: any = undefined;

  // Log error only in development with full stack
  if (process.env.NODE_ENV === 'development') {
    LoggerHelper.error('ErrorHandler', request.url, error.message, error);
  } else {
    // Production: log minimal info
    LoggerHelper.error('ErrorHandler', request.url, 'Request failed', undefined);
  }

  // Handle different error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Invalid request data';
    // Don't expose detailed validation errors in production
    if (process.env.NODE_ENV === 'development') {
      const zodError = error as any;
      details = zodError.errors?.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
    }
  } else if ((error as any).validation) {
    statusCode = 400;
    message = 'Invalid request data';
    if (process.env.NODE_ENV === 'development') {
      details = (error as any).validation;
    }
  } else if ((error as any).statusCode) {
    statusCode = (error as any).statusCode;
    message = (error as any).message;
  }

  // Send error response (minimal in production)
  const response: any = {
    success: false,
    message,
  };

  // Only add extra info in development
  if (process.env.NODE_ENV === 'development') {
    response.timestamp = new Date().toISOString();
    response.path = request.url;
    
    if (details) {
      response.details = details;
    }
  }

  return reply.status(statusCode).send(response);
}
