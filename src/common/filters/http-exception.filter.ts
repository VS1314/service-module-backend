import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { RequestWithId } from '../middleware/request-id.middleware';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<RequestWithId>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const { message, details } = this.extractErrorDetails(errorResponse);

    response.status(status).json({
      error: {
        code: this.getErrorCode(status),
        message,
        details,
        requestId: request.requestId,
      },
    });
  }

  private extractErrorDetails(errorResponse: unknown): {
    message: string;
    details: string[] | null;
  } {
    if (typeof errorResponse === 'string') {
      return {
        message: errorResponse,
        details: null,
      };
    }

    if (
      typeof errorResponse === 'object' &&
      errorResponse !== null &&
      'message' in errorResponse
    ) {
      const rawMessage = errorResponse.message;

      if (Array.isArray(rawMessage)) {
        return {
          message: 'Validation failed',
          details: rawMessage.map(String),
        };
      }

      if (typeof rawMessage === 'string') {
        return {
          message: rawMessage,
          details: null,
        };
      }
    }

    return {
      message: 'Internal server error',
      details: null,
    };
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';

      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';

      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';

      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';

      case HttpStatus.CONFLICT:
        return 'CONFLICT';

      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';

      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_SERVER_ERROR';

      default:
        return `HTTP_${status}`;
    }
  }
}
