const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/records.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize, consentCheck } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { encounterSchema, diagnosisSchema, prescriptionSchema, vitalsSchema } = require('../validators/records.validators');

const PROVIDERS   = ['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'FACILITY_ADMIN', 'MINISTRY_ADMIN', 'SUPER_ADMIN'];
const DOCUMENT_UPLOADERS = ['PATIENT', ...PROVIDERS];
const CLINICIANS  = ['DOCTOR', 'NURSE', 'FACILITY_ADMIN', 'MINISTRY_ADMIN', 'SUPER_ADMIN'];
const PHARMACISTS = ['PHARMACIST', 'DOCTOR', 'FACILITY_ADMIN', 'SUPER_ADMIN'];

// ── Encounters ────────────────────────────────────────────────────────────────
/**
 * @openapi
 * /records/visits:
 *   post:
 *     tags: [Encounters]
 *     summary: Create a new medical encounter/visit
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientDid]
 *             properties:
 *               patientDid: { type: string }
 *               facilityId: { type: string, format: uuid }
 *               encounterType: { type: string, enum: [OUTPATIENT, INPATIENT, EMERGENCY, TELEHEALTH, FOLLOW_UP] }
 *               chiefComplaint: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201: { description: Created }
 */
router.post('/visits', authenticate, authorize(...CLINICIANS), validate(encounterSchema), ctrl.createEncounter);

/**
 * @openapi
 * /records/visits/{id}:
 *   get:
 *     tags: [Encounters]
 *     summary: Get encounter details by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Success }
 */
router.get('/visits/:id', authenticate, ctrl.getEncounter);

/**
 * @openapi
 * /records/patient/{did}:
 *   get:
 *     tags: [Encounters]
 *     summary: Get all medical records for a specific patient
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Success }
 */
router.get('/patient/:did', authenticate, consentCheck, ctrl.getPatientRecords);

// ── Diagnoses ─────────────────────────────────────────────────────────────────
/**
 * @openapi
 * /records/diagnoses:
 *   post:
 *     tags: [Diagnoses]
 *     summary: Add a medical diagnosis to an encounter
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [encounterId, patientDid, description]
 *             properties:
 *               encounterId: { type: string, format: uuid }
 *               patientDid: { type: string }
 *               icd10Code: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [ACTIVE, RESOLVED, CHRONIC, SUSPECTED] }
 *               severity: { type: string }
 *     responses:
 *       201: { description: Created }
 */
router.post('/diagnoses', authenticate, authorize(...CLINICIANS), validate(diagnosisSchema), ctrl.addDiagnosis);

/**
 * @openapi
 * /records/diagnoses/{did}:
 *   get:
 *     tags: [Diagnoses]
 *     summary: Get diagnosis history for a patient
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Success }
 */
router.get('/diagnoses/:did', authenticate, consentCheck, ctrl.getPatientDiagnoses);

// ── Prescriptions ─────────────────────────────────────────────────────────────
/**
 * @openapi
 * /records/prescriptions:
 *   post:
 *     tags: [Prescriptions]
 *     summary: Issue a new prescription (Doctor only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [encounterId, patientDid, drugName, dosage, frequency, durationDays]
 *             properties:
 *               encounterId: { type: string, format: uuid }
 *               patientDid: { type: string }
 *               drugName: { type: string }
 *               genericName: { type: string }
 *               dosage: { type: string }
 *               frequency: { type: string }
 *               durationDays: { type: integer }
 *               instructions: { type: string }
 *     responses:
 *       201: { description: Created }
 */
router.post('/prescriptions', authenticate, authorize('DOCTOR', 'SUPER_ADMIN'), validate(prescriptionSchema), ctrl.createPrescription);

/**
 * @openapi
 * /records/prescriptions/{did}:
 *   get:
 *     tags: [Prescriptions]
 *     summary: List prescriptions for a patient
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Success }
 */
router.get('/prescriptions/:did', authenticate, consentCheck, ctrl.getPatientPrescriptions);

/**
 * @openapi
 * /records/prescriptions/{id}/dispense:
 *   put:
 *     tags: [Prescriptions]
 *     summary: Mark a prescription as dispensed (Pharmacist only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Dispensed }
 */
router.put('/prescriptions/:id/dispense', authenticate, authorize(...PHARMACISTS), ctrl.dispensePrescription);

// ── Vitals ────────────────────────────────────────────────────────────────────
/**
 * @openapi
 * /records/vitals:
 *   post:
 *     tags: [Vitals]
 *     summary: Record patient vitals
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [encounterId, patientDid]
 *             properties:
 *               encounterId: { type: string, format: uuid }
 *               patientDid: { type: string }
 *               temperatureC: { type: number }
 *               bloodPressure: { type: string }
 *               pulseRate: { type: integer }
 *               respiratoryRate: { type: integer }
 *               weightKg: { type: number }
 *               heightCm: { type: number }
 *               oxygenSat: { type: number }
 *               bloodGlucose: { type: number }
 *     responses:
 *       201: { description: Recorded }
 */
router.post('/vitals', authenticate, authorize(...CLINICIANS), validate(vitalsSchema), ctrl.recordVitals);

/**
 * @openapi
 * /records/vitals/{did}/latest:
 *   get:
 *     tags: [Vitals]
 *     summary: Get latest vitals for a patient
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Success }
 */
router.get('/vitals/:did/latest', authenticate, consentCheck, ctrl.getLatestVitals);

/**
 * @openapi
 * /records/vitals/{did}/history:
 *   get:
 *     tags: [Vitals]
 *     summary: Get vitals history for a patient
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Success }
 */
router.get('/vitals/:did/history', authenticate, consentCheck, ctrl.getVitalsHistory);

// ── Timeline & Summary ────────────────────────────────────────────────────────
/**
 * @openapi
 * /records/timeline/{did}:
 *   get:
 *     tags: [Health Context]
 *     summary: Get full patient health timeline
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Success }
 */
router.get('/timeline/:did', authenticate, consentCheck, ctrl.getTimeline);

/**
 * @openapi
 * /records/summary/{did}:
 *   get:
 *     tags: [Health Context]
 *     summary: Get patient health summary (active conditions, etc.)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Success }
 */
router.get('/summary/:did', authenticate, consentCheck, ctrl.getSummary);

// ── Documents ─────────────────────────────────────────────────────────────────
/**
 * @openapi
 * /records/documents:
 *   post:
 *     tags: [Documents]
 *     summary: Upload a medical document reference
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [encounterId, patientDid, fileName, storagePath]
 *             properties:
 *               encounterId: { type: string, format: uuid }
 *               patientDid: { type: string }
 *               documentType: { type: string, enum: [LAB_RESULT, XRAY, SCAN, DISCHARGE_SUMMARY, REFERRAL, OTHER] }
 *               fileName: { type: string }
 *               storagePath: { type: string }
 *     responses:
 *       201: { description: Uploaded }
 */
router.post('/documents', authenticate, authorize(...DOCUMENT_UPLOADERS), ctrl.uploadDocument);

/**
 * @openapi
 * /records/documents/{did}:
 *   get:
 *     tags: [Documents]
 *     summary: List documents for a patient
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Success }
 */
router.get('/documents/:did', authenticate, consentCheck, ctrl.getPatientDocuments);

// ── Provider records ──────────────────────────────────────────────────────────
/**
 * @openapi
 * /records/provider/{did}:
 *   get:
 *     tags: [Encounters]
 *     summary: Get all records created by a provider (encounters, diagnoses, prescriptions)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Success }
 */
router.get('/provider/:did', authenticate, authorize(...PROVIDERS), ctrl.getProviderRecords);

// ── Analytics ─────────────────────────────────────────────────────────────────
const ADMIN_ROLES = ['MINISTRY_ADMIN', 'SUPER_ADMIN', 'FACILITY_ADMIN'];
/**
 * @openapi
 * /records/analytics:
 *   get:
 *     tags: [Analytics]
 *     summary: Get global records analytics (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Success }
 */
router.get('/analytics', authenticate, authorize(...ADMIN_ROLES), ctrl.getAnalytics);

module.exports = router;

