import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Base controller class that provides common HTTP response methods
 * Implements the Controller layer pattern for handling HTTP requests
 */
export abstract class BaseController {
  /**
   * Send success response
   */
  protected sendSuccess<T>(reply: FastifyReply, data: T, message = 'Success', statusCode = 200) {
    return reply.status(statusCode).send({
      success: true,
      message,
      data,
    });
  }

  /**
   * Send error response
   */
  protected sendError(reply: FastifyReply, message: string, statusCode = 400, error?: any) {
    return reply.status(statusCode).send({
      success: false,
      message,
      ...(error && { error }),
    });
  }

  /**
   * Send paginated response
   */
  protected sendPaginated<T>(
    reply: FastifyReply,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    },
    message = 'Success'
  ) {
    return reply.status(200).send({
      success: true,
      message,
      data,
      pagination,
    });
  }

  /**
   * Send created response
   */
  protected sendCreated<T>(reply: FastifyReply, data: T, message = 'Created successfully') {
    return this.sendSuccess(reply, data, message, 201);
  }

  /**
   * Send no content response
   */
  protected sendNoContent(reply: FastifyReply, message = 'Deleted successfully') {
    return reply.status(204).send({
      success: true,
      message,
    });
  }

  /**
   * Handle service errors
   */
  protected handleServiceError(reply: FastifyReply, error: any) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = this.getErrorStatusCode(message);
    return this.sendError(reply, message, statusCode);
  }

  /**
   * Get appropriate status code based on error message
   */
  private getErrorStatusCode(message: string): number {
    if (message.includes('not found')) return 404;
    if (message.includes('already taken') || message.includes('already exists')) return 409;
    if (message.includes('Invalid credentials') || message.includes('Unauthorized')) return 401;
    if (message.includes('Forbidden')) return 403;
    if (message.includes('validation') || message.includes('required')) return 400;
    return 500;
  }

  /**
   * Extract user from request (for authenticated routes)
   */
  protected getUserFromRequest(request: FastifyRequest): any {
    return (request as any).user;
  }

  /**
   * Check if user has required role
   */
  protected hasRole(user: any, requiredRole: string): boolean {
    return user?.role === requiredRole;
  }

  /**
   * Check if user is admin
   */
  protected isAdmin(user: any): boolean {
    return this.hasRole(user, 'ADMIN');
  }

  /**
   * Check if user is member or admin
   */
  protected isMemberOrAdmin(user: any): boolean {
    return this.hasRole(user, 'MEMBER') || this.hasRole(user, 'ADMIN');
  }
}
