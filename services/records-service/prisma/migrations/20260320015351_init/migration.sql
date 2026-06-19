-- CreateEnum
CREATE TYPE "EncounterType" AS ENUM ('OUTPATIENT', 'INPATIENT', 'EMERGENCY', 'TELEHEALTH', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "DiagnosisStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'CHRONIC', 'SUSPECTED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('LAB_RESULT', 'XRAY', 'SCAN', 'DISCHARGE_SUMMARY', 'REFERRAL', 'OTHER');

-- CreateTable
CREATE TABLE "encounters" (
    "id" TEXT NOT NULL,
    "patientDid" TEXT NOT NULL,
    "providerDid" TEXT NOT NULL,
    "facilityId" TEXT,
    "encounterType" "EncounterType" NOT NULL DEFAULT 'OUTPATIENT',
    "chiefComplaint" TEXT,
    "notes" TEXT,
    "encounterDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dischargeDate" TIMESTAMP(3),
    "isOfflineSync" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encounters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnoses" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientDid" TEXT NOT NULL,
    "icd10Code" TEXT,
    "description" TEXT NOT NULL,
    "status" "DiagnosisStatus" NOT NULL DEFAULT 'ACTIVE',
    "severity" TEXT,
    "diagnosedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientDid" TEXT NOT NULL,
    "drugName" TEXT NOT NULL,
    "genericName" TEXT,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "instructions" TEXT,
    "dispensed" BOOLEAN NOT NULL DEFAULT false,
    "dispensedAt" TIMESTAMP(3),
    "dispensedBy" TEXT,
    "prescribedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vitals" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientDid" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temperatureC" DOUBLE PRECISION,
    "bloodPressure" TEXT,
    "pulseRate" INTEGER,
    "respiratoryRate" INTEGER,
    "weightKg" DOUBLE PRECISION,
    "heightCm" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "oxygenSat" DOUBLE PRECISION,
    "bloodGlucose" DOUBLE PRECISION,
    "recordedBy" TEXT NOT NULL,

    CONSTRAINT "vitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientDid" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL DEFAULT 'OTHER',
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "storagePath" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "encounters_patientDid_idx" ON "encounters"("patientDid");

-- CreateIndex
CREATE INDEX "encounters_providerDid_idx" ON "encounters"("providerDid");

-- CreateIndex
CREATE INDEX "diagnoses_patientDid_idx" ON "diagnoses"("patientDid");

-- CreateIndex
CREATE INDEX "prescriptions_patientDid_idx" ON "prescriptions"("patientDid");

-- CreateIndex
CREATE INDEX "vitals_patientDid_idx" ON "vitals"("patientDid");

-- CreateIndex
CREATE INDEX "documents_patientDid_idx" ON "documents"("patientDid");

-- AddForeignKey
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vitals" ADD CONSTRAINT "vitals_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
