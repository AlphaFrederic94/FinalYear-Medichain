-- CreateEnum
CREATE TYPE "FacilityType" AS ENUM ('HOSPITAL', 'CLINIC', 'PHARMACY', 'LABORATORY', 'HEALTH_CENTER');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'FACILITY_ADMIN');

-- CreateTable
CREATE TABLE "facilities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "facilityType" "FacilityType" NOT NULL,
    "registrationNo" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'CMR',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "userDid" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'DOCTOR',
    "specialty" TEXT,
    "licenseNo" TEXT,
    "facilityId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "facilities_registrationNo_key" ON "facilities"("registrationNo");

-- CreateIndex
CREATE UNIQUE INDEX "staff_userDid_key" ON "staff"("userDid");

-- CreateIndex
CREATE UNIQUE INDEX "staff_licenseNo_key" ON "staff"("licenseNo");

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
