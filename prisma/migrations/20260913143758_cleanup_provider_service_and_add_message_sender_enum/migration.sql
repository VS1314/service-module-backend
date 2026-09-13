-- Create enum for message sender type
CREATE TYPE "MessageSenderType" AS ENUM ('USER', 'PROVIDER');

-- Preserve existing senderType values while converting String -> enum
ALTER TABLE "messages"
ALTER COLUMN "senderType" TYPE "MessageSenderType"
USING ("senderType"::"MessageSenderType");

-- Remove unintended ProviderService -> ServiceBooking relation
ALTER TABLE "provider_services"
DROP CONSTRAINT "provider_services_serviceBookingId_fkey";

ALTER TABLE "provider_services"
DROP COLUMN "serviceBookingId";
