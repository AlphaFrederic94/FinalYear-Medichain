const { z } = require('zod');

const encounterSchema = z.object({
  patientDid:    z.string().min(1),
  facilityId:    z.string().uuid().optional(),
  encounterType: z.enum(['OUTPATIENT', 'INPATIENT', 'EMERGENCY', 'TELEHEALTH', 'FOLLOW_UP']).default('OUTPATIENT'),
  chiefComplaint:z.string().max(500).optional(),
  notes:         z.string().optional(),
  encounterDate: z.string().datetime({ offset: true }).optional(),
});

const diagnosisSchema = z.object({
  encounterId: z.string().uuid(),
  patientDid:  z.string().min(1),
  icd10Code:   z.string().max(20).optional(),
  description: z.string().min(1).max(500),
  status:      z.enum(['ACTIVE', 'RESOLVED', 'CHRONIC', 'SUSPECTED']).default('ACTIVE'),
  severity:    z.string().max(50).optional(),
});

const prescriptionSchema = z.object({
  encounterId:  z.string().uuid(),
  patientDid:   z.string().min(1),
  drugName:     z.string().min(1).max(200),
  genericName:  z.string().max(200).optional(),
  dosage:       z.string().min(1).max(100),
  frequency:    z.string().min(1).max(100),
  durationDays: z.number().int().min(1),
  instructions: z.string().max(500).optional(),
});

const vitalsSchema = z.object({
  encounterId:    z.string().uuid(),
  patientDid:     z.string().min(1),
  temperatureC:   z.number().optional(),
  bloodPressure:  z.string().max(20).optional(),
  pulseRate:      z.number().int().optional(),
  respiratoryRate:z.number().int().optional(),
  weightKg:       z.number().optional(),
  heightCm:       z.number().optional(),
  oxygenSat:      z.number().optional(),
  bloodGlucose:   z.number().optional(),
});

module.exports = { encounterSchema, diagnosisSchema, prescriptionSchema, vitalsSchema };
