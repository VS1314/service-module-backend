# Service Module Backend

Backend API for the Service module of the application.

The module supports service discovery, categories, promotions, provider search, provider profiles, availability, bookings, customer-provider conversations, text/voice messages, and realtime chat.

## Tech Stack

- Node.js
- TypeScript
- NestJS
- PostgreSQL
- Prisma ORM
- Socket.IO
- Swagger / OpenAPI
- Jest
- class-validator
- class-transformer

## Main Features

### Service Discovery

- Service home aggregation
- Categories and promotions
- Provider search, filtering, sorting, and pagination
- Provider details
- Provider availability

### Booking

- Transactional slot reservation
- Double-booking protection
- Booking address snapshot
- Booking list and details
- Booking cancellation
- Booking status history
- Slot release after cancellation

### Chat

- Create or reuse conversations
- Paginated conversation/message history
- Text messages
- Voice-message metadata
- Socket.IO realtime messaging
- Conversation room authorization

### Platform Features

- Request IDs
- Structured HTTP logging
- Standardized REST errors
- Environment validation
- Configurable CORS
- PostgreSQL health check
- Swagger / OpenAPI
- Production Prisma migration workflow

## Requirements

- Node.js 24 LTS
- npm
- PostgreSQL 15+
- Git

The project was developed and verified with Node.js 24.19.0 and PostgreSQL 15.4.

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/service_backend
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

Multiple frontend origins can be comma-separated. Never commit the real `.env` file.

## Install Dependencies

```bash
npm install
```

## Prisma

```bash
npm run prisma:generate
npm run prisma:migrate:status
```

Development migration:

```bash
npm run prisma:migrate:dev
```

Production migration:

```bash
npm run prisma:migrate:deploy
```

Development/demo seed:

```bash
npm run db:seed:dev
```

The development seed must not be executed automatically in production.

## Running the Application

Development:

```bash
npm run start:dev
```

Production:

```bash
npm run build:prod
npm run start:prod
```

Default server: `http://localhost:3000`

## API Base Path

`/api/v1/service`

## Main REST Endpoints

### Service Home

`GET /api/v1/service/home`

### Categories

- `GET /api/v1/service/categories`
- `GET /api/v1/service/categories/:categoryId`

### Promotions

`GET /api/v1/service/promotions`

### Providers

- `GET /api/v1/service/providers`
- `GET /api/v1/service/providers/:providerId`
- `GET /api/v1/service/providers/:providerId/availability`

Provider discovery supports `q`, `categoryId`, `minRating`, `minDiscount`, `sort`, `page`, and `limit`.

Availability expects `date=YYYY-MM-DD`.

### Bookings

- `POST /api/v1/service/bookings`
- `GET /api/v1/service/bookings`
- `GET /api/v1/service/bookings/:bookingId`
- `PATCH /api/v1/service/bookings/:bookingId/cancel`

### Conversations and Messages

- `POST /api/v1/service/conversations`
- `GET /api/v1/service/conversations`
- `GET /api/v1/service/conversations/:conversationId/messages`
- `POST /api/v1/service/conversations/:conversationId/messages`
- `POST /api/v1/service/conversations/:conversationId/voice-messages`

## Swagger / OpenAPI

- Swagger UI: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api/docs-json`

## Health Check

`GET /health`

Successful response:

```json
{
  "status": "ok",
  "database": "up",
  "timestamp": "..."
}
```

Database failure returns HTTP 503.

## Realtime Chat

Socket.IO namespace: `/service-chat`

Client events:

- `joinConversation`
- `sendMessage`
- `sendVoiceMessage`

Server event:

- `messageCreated`

A socket must successfully join a conversation before sending messages.

## Validation and Errors

Global DTO validation uses transformation, property whitelisting, and class-validator.

REST errors use a common structure:

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Request validation failed",
    "details": null,
    "requestId": "request-id"
  }
}
```

Every HTTP request receives an `x-request-id`. Internal server error details are not exposed to clients.

## Logging

HTTP logging records request ID, method, path, response status, and duration. Request bodies and credentials are not intentionally logged.

## CORS

REST and Socket.IO origins are restricted using `CORS_ORIGIN`. Multiple origins can be comma-separated. Do not use wildcard CORS in production.

## Testing

```bash
npm test -- --runInBand
npm run lint
```

Verified baseline:

```text
Test Suites: 8 passed, 8 total
Tests:       48 passed, 48 total
Lint:        0 warnings, 0 errors
```

## Production Deployment

Recommended order:

1. Install dependencies.
2. Configure production environment variables.
3. Build the application.
4. Apply committed Prisma migrations.
5. Start the compiled application.
6. Verify `/health`.

```bash
npm install
npm run build:prod
npm run prisma:migrate:deploy
npm run start:prod
```

Production must use `prisma:migrate:deploy`, not `prisma:migrate:dev`.

## Authentication Integration Boundary

The Service module contains a centralized current-user integration boundary.

Temporary compatibility behavior still accepts `userId` from request body/query inputs because the main application's authentication system has not yet been integrated. This must not be treated as production authentication.

When the main authentication layer is available:

1. Populate `request.user`.
2. Use authenticated identity through the existing current-user boundary.
3. Remove temporary body/query `userId` fallback behavior.
4. Connect Socket.IO authentication to the real identity mechanism.

## Remaining External Integrations

- Main application authentication
- Existing user/account system
- Existing saved-address system
- Provider/admin management
- Real object storage for voice-message media
- Production provider/business data
- Provider-side authenticated messaging
- Multi-instance Socket.IO adapter if horizontally scaled
- Production monitoring and alerting infrastructure

## Booking Concurrency

Availability reservation is transactional and rejects an already-reserved slot. Cancellation uses guarded transactional updates so concurrent cancellation attempts cannot create duplicate successful cancellations.

## Seed Policy

`prisma/seed.ts` contains development/demo data. Run it only when demo data is intentionally required:

```bash
npm run db:seed:dev
```

Do not include this command in an automatic production deployment pipeline.

## Useful Commands

```bash
npm run start:dev
npm run format
npm run lint
npm test -- --runInBand
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:migrate:status
npm run prisma:migrate:deploy
npm run db:seed:dev
npm run build:prod
npm run start:prod
```

## Project Documentation

Detailed requirements and API design are maintained in `Service_Module_Backend_Requirements_and_API_Design.docx`.

## Current Backend Status

Implemented and verified: service discovery, categories, promotions, provider search/filter/sort/pagination, provider details, availability, transactional bookings, cancellation, booking status history, address snapshots, conversations, text messages, voice-message metadata, Socket.IO realtime messaging, DTO validation, standardized errors, request IDs, structured logging, Swagger/OpenAPI, environment validation, production CORS, database health/readiness, Prisma production migrations, production build/startup verification, and automated regression tests.

The Service backend is ready for integration with the surrounding application's authentication, user/address, storage, provider-management, and deployment infrastructure.
