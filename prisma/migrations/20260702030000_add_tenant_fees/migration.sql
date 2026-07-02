-- AlterTable
ALTER TABLE "tenant_billing" ADD COLUMN "bookingFeePercent" INTEGER NOT NULL DEFAULT 7;

-- AlterTable
ALTER TABLE "tenant_billing" ADD COLUMN "saasFeePerVehicle" INTEGER NOT NULL DEFAULT 20000;
