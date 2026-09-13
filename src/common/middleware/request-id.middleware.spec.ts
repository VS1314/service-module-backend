import { jest } from '@jest/globals';
import { NextFunction, Response } from 'express';
import { RequestIdMiddleware, RequestWithId } from './request-id.middleware';

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
  });

  it('preserves a client supplied request ID', () => {
    const req = {
      header: jest.fn(() => 'client-request-123'),
    } as unknown as RequestWithId;

    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;

    const next = jest.fn() as unknown as NextFunction;

    middleware.use(req, res, next);

    expect(req.requestId).toBe('client-request-123');
    expect(res.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      'client-request-123',
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('trims whitespace from a client supplied request ID', () => {
    const req = {
      header: jest.fn(() => '  client-request-123  '),
    } as unknown as RequestWithId;

    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;

    const next = jest.fn() as unknown as NextFunction;

    middleware.use(req, res, next);

    expect(req.requestId).toBe('client-request-123');
    expect(res.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      'client-request-123',
    );
  });

  it('generates a request ID when one is not supplied', () => {
    const req = {
      header: jest.fn(() => undefined),
    } as unknown as RequestWithId;

    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;

    const next = jest.fn() as unknown as NextFunction;

    middleware.use(req, res, next);

    expect(req.requestId).toEqual(expect.any(String));
    expect(req.requestId.length).toBeGreaterThan(0);

    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', req.requestId);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('generates a request ID when the supplied value is only whitespace', () => {
    const req = {
      header: jest.fn(() => '   '),
    } as unknown as RequestWithId;

    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;

    const next = jest.fn() as unknown as NextFunction;

    middleware.use(req, res, next);

    expect(req.requestId).toEqual(expect.any(String));
    expect(req.requestId).not.toBe('');
    expect(req.requestId).not.toBe('   ');
  });
});
