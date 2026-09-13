import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Socket } from 'socket.io';

@Catch(HttpException)
export class WsHttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    const response = exception.getResponse();

    let details: string[] = [exception.message];

    if (
      typeof response === 'object' &&
      response !== null &&
      'message' in response
    ) {
      const message = response.message;

      details = Array.isArray(message)
        ? message.map(String)
        : [String(message)];
    }

    client.emit('exception', {
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'WebSocket payload validation failed',
      details,
    });
  }
}
