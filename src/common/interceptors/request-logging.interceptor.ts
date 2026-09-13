import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { RequestWithId } from '../middleware/request-id.middleware';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithId>();
    const response = context.switchToHttp().getResponse<Response>();

    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.writeLog({
          requestId: request.requestId,
          method: request.method,
          path: request.originalUrl,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
        });
      }),
      catchError((error: unknown) => {
        const statusCode =
          error instanceof HttpException ? error.getStatus() : 500;

        this.writeLog(
          {
            requestId: request.requestId,
            method: request.method,
            path: request.originalUrl,
            statusCode,
            durationMs: Date.now() - startedAt,
          },
          true,
        );

        return throwError(() => error);
      }),
    );
  }

  private writeLog(
    data: {
      requestId: string;
      method: string;
      path: string;
      statusCode: number;
      durationMs: number;
    },
    isError = false,
  ) {
    const message = JSON.stringify(data);

    if (isError) {
      this.logger.error(message);
      return;
    }

    this.logger.log(message);
  }
}
