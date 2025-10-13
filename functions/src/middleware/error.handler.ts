import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '@/errors';
import { LoggerHelper } from '@/utils/logger.helper';

export async function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: any = undefined;

  if (process.env.NODE_ENV === 'development') {
    LoggerHelper.error('ErrorHandler', request.url, error.message, error);
  } else {
    LoggerHelper.error('ErrorHandler', request.url, 'Request failed', undefined);
  }

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Invalid request data';
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
  } else if (error.message && error.message.includes('Cannot read properties of undefined')) {
    statusCode = 500;
    message = 'Internal server error';
  }

  const response: any = {
    success: false,
    message,
  };

  if (process.env.NODE_ENV === 'development') {
    response.timestamp = new Date().toISOString();
    response.path = request.url;
    
    if (details) {
      response.details = details;
    }
    
    if (error.stack) {
      response.stack = error.stack;
    }
  }

  reply.code(statusCode);
  return reply.send(response);
}
