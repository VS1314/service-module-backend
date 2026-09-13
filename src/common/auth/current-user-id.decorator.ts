import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
    userId?: string;
  };
};

function normalizeUserId(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
}

export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const authenticatedUserId =
      normalizeUserId(request.user?.id) ??
      normalizeUserId(request.user?.userId);

    if (authenticatedUserId) {
      return authenticatedUserId;
    }

    /*
     * Temporary compatibility fallback.
     *
     * Until the main application's authentication layer is integrated,
     * existing Service APIs still receive userId from the request.
     *
     * Remove this fallback once authentication populates request.user.
     */
    const bodyUserId =
      request.body && typeof request.body === 'object'
        ? normalizeUserId((request.body as Record<string, unknown>).userId)
        : undefined;

    const queryUserId = normalizeUserId(request.query?.userId);

    const temporaryUserId = bodyUserId ?? queryUserId;

    if (temporaryUserId) {
      return temporaryUserId;
    }

    throw new UnauthorizedException('Authenticated user identity is required');
  },
);
