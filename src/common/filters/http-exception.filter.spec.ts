import { jest } from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common/interfaces';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  const json = jest.fn();
  const status = jest.fn(() => ({ json }));

  const request = {
    requestId: 'request-test-123',
  };

  const host = {
    switchToHttp: jest.fn(() => ({
      getResponse: jest.fn(() => ({
        status,
      })),
      getRequest: jest.fn(() => request),
    })),
  } as unknown as ArgumentsHost;

  beforeEach(() => {
    jest.clearAllMocks();
    filter = new HttpExceptionFilter();
  });

  it('formats a normal bad request', () => {
    filter.catch(new BadRequestException('Invalid booking request'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);

    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid booking request',
        details: null,
        requestId: 'request-test-123',
      },
    });
  });

  it('formats validation errors with details', () => {
    filter.catch(
      new BadRequestException({
        message: [
          'minRating must not be greater than 5',
          'page must not be less than 1',
        ],
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);

    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'BAD_REQUEST',
        message: 'Validation failed',
        details: [
          'minRating must not be greater than 5',
          'page must not be less than 1',
        ],
        requestId: 'request-test-123',
      },
    });
  });

  it('formats a not found error', () => {
    filter.catch(new NotFoundException('Provider not found'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);

    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'NOT_FOUND',
        message: 'Provider not found',
        details: null,
        requestId: 'request-test-123',
      },
    });
  });

  it('formats a conflict error', () => {
    filter.catch(new ConflictException('SLOT_NOT_AVAILABLE'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);

    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'CONFLICT',
        message: 'SLOT_NOT_AVAILABLE',
        details: null,
        requestId: 'request-test-123',
      },
    });
  });

  it('hides unknown internal error details', () => {
    filter.catch(new Error('database password leaked'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);

    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details: null,
        requestId: 'request-test-123',
      },
    });
  });
});
