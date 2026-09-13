-- CreateTable
CREATE TABLE "provider_availability" (
    "id" SERIAL NOT NULL,
    "providerId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_availability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "provider_availability_providerId_date_isActive_idx" ON "provider_availability"("providerId", "date", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "provider_availability_providerId_date_startTime_endTime_key" ON "provider_availability"("providerId", "date", "startTime", "endTime");

-- AddForeignKey
ALTER TABLE "provider_availability" ADD CONSTRAINT "provider_availability_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "service_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
