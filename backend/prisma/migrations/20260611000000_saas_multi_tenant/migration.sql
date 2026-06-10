-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('TRIAL', 'BASIC', 'PRO', 'ENTERPRISE');
CREATE TYPE "CycleType" AS ENUM ('MONTHLY', 'YEARLY', 'LIFETIME');
CREATE TYPE "SubStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED', 'LIFETIME');
CREATE TYPE "SaasPaymentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateTable: tenants
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
CREATE UNIQUE INDEX "tenants_ownerEmail_key" ON "tenants"("ownerEmail");
CREATE INDEX "tenants_ownerEmail_idx" ON "tenants"("ownerEmail");
CREATE INDEX "tenants_isActive_idx" ON "tenants"("isActive");

-- CreateTable: subscriptions
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "plan" "PlanType" NOT NULL DEFAULT 'TRIAL',
    "cycle" "CycleType" NOT NULL DEFAULT 'MONTHLY',
    "status" "SubStatus" NOT NULL DEFAULT 'TRIAL',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "graceEndsAt" TIMESTAMP(3),
    "maxBranches" INTEGER NOT NULL DEFAULT 1,
    "maxUsers" INTEGER NOT NULL DEFAULT 2,
    "maxProducts" INTEGER NOT NULL DEFAULT 50,
    "brilinkEnabled" BOOLEAN NOT NULL DEFAULT false,
    "exportEnabled" BOOLEAN NOT NULL DEFAULT false,
    "opnameEnabled" BOOLEAN NOT NULL DEFAULT false,
    "supplierEnabled" BOOLEAN NOT NULL DEFAULT false,
    "transferEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "subscriptions_tenantId_key" ON "subscriptions"("tenantId");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");
CREATE INDEX "subscriptions_endDate_idx" ON "subscriptions"("endDate");

-- CreateTable: saas_payments
CREATE TABLE "saas_payments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "plan" "PlanType" NOT NULL,
    "cycle" "CycleType" NOT NULL,
    "status" "SaasPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "proofUrl" TEXT,
    "uniqueCode" TEXT,
    "notes" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "saas_payments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "saas_payments_tenantId_idx" ON "saas_payments"("tenantId");
CREATE INDEX "saas_payments_status_idx" ON "saas_payments"("status");
CREATE INDEX "saas_payments_createdAt_idx" ON "saas_payments"("createdAt");

-- Add tenantId to users (nullable for backward compat)
ALTER TABLE "users" ADD COLUMN "tenantId" TEXT;

-- Add tenantId to shops (nullable for backward compat)
ALTER TABLE "shops" ADD COLUMN "tenantId" TEXT;

-- Foreign Keys
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saas_payments" ADD CONSTRAINT "saas_payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "shops" ADD CONSTRAINT "shops_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
