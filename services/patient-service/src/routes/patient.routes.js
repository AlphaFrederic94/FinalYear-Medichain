const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/patient.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize }    = require('../middleware/authorize');
const { validate }     = require('../middleware/validate');
const {
  updateProfileSchema,
  allergySchema,
  emergencyContactSchema,
  searchSchema,
} = require('../validators/patient.validators');
const { z } = require('zod');

const PROVIDER_ROLES = ['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'FACILITY_ADMIN', 'MINISTRY_ADMIN', 'SUPER_ADMIN'];

// ── Own profile (patient) ─────────────────────────────────────────────────────
/**
 * @openapi
 * /patients/me:
 *   get:
 *     tags: [Patients]
 *     summary: Get my own patient profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Success }
 */
router.get('/me',          authenticate, ctrl.getMe);

/**
 * @openapi
 * /patients/me:
 *   put:
 *     tags: [Patients]
 *     summary: Update my own patient profile
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateProfile' }
 *     responses:
 *       200: { description: Success }
 */
router.put('/me',          authenticate, authorize('PATIENT'), validate(updateProfileSchema), ctrl.updateMe);

/**
 * @openapi
 * /patients/me/summary:
 *   get:
 *     tags: [Patients]
 *     summary: Get a summary of my health info
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Success }
 */
router.get('/me/summary',  authenticate, ctrl.getSummary);

// ── Allergies ─────────────────────────────────────────────────────────────────
/**
 * @openapi
 * /patients/me/allergies:
 *   get:
 *     tags: [Patients]
 *     summary: List my own allergies
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Success }
 */
router.get('/me/allergies', authenticate, ctrl.listAllergies);

/**
 * @openapi
 * /patients/me/allergies:
 *   put:
 *     tags: [Patients]
 *     summary: Update my allergies list
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               allergies:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     substance: { type: string }
 *                     reaction: { type: string }
 *                     severity: { type: string, enum: [MILD, MODERATE, SEVERE] }
 *     responses:
 *       200: { description: Success }
 */
router.put('/me/allergies', authenticate, authorize('PATIENT'),
  validate(z.object({ allergies: z.array(allergySchema) })),
  ctrl.updateAllergies
);

// ── Emergency contacts ────────────────────────────────────────────────────────
/**
 * @openapi
 * /patients/me/emergency-contacts:
 *   get:
 *     tags: [Patients]
 *     summary: List my emergency contacts
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Success }
 */
router.get('/me/emergency-contacts', authenticate, ctrl.listContacts);

/**
 * @openapi
 * /patients/me/emergency-contacts:
 *   post:
 *     tags: [Patients]
 *     summary: Add a new emergency contact
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, relationship, phone]
 *             properties:
 *               name: { type: string }
 *               relationship: { type: string }
 *               phone: { type: string }
 *     responses:
 *       201: { description: Created }
 */
router.post('/me/emergency-contacts', authenticate, authorize('PATIENT'), validate(emergencyContactSchema), ctrl.addContact);

/**
 * @openapi
 * /patients/me/emergency-contacts/{id}:
 *   delete:
 *     tags: [Patients]
 *     summary: Delete an emergency contact
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Deleted }
 */
router.delete('/me/emergency-contacts/:id', authenticate, authorize('PATIENT'), ctrl.deleteContact);
router.get('/analytics', authenticate, authorize('MINISTRY_ADMIN', 'SUPER_ADMIN', 'FACILITY_ADMIN'), ctrl.getAnalytics);

// ── Provider access ───────────────────────────────────────────────────────────
/**
 * @openapi
 * /patients/{did}:
 *   get:
 *     tags: [Patients - Provider Access]
 *     summary: Get a patient profile by DID (Provider only)
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema: { type: string }
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Success }
 */
router.get('/:did',   authenticate, authorize(...PROVIDER_ROLES), ctrl.getByDid);

/**
 * @openapi
 * /patients/search:
 *   post:
 *     tags: [Patients - Provider Access]
 *     summary: Search for patients (Provider only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query: { type: string }
 *     responses:
 *       200: { description: Success }
 */
router.post('/search', authenticate, authorize(...PROVIDER_ROLES), validate(searchSchema), ctrl.search);

// ── Analytics ─────────────────────────────────────────────────────────────────
const ADMIN_ROLES = ['MINISTRY_ADMIN', 'SUPER_ADMIN', 'FACILITY_ADMIN'];
/**
 * @openapi
 * /patients/analytics:
 *   get:
 *     tags: [Analytics]
 *     summary: Get patient registration analytics (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Success }
 */
router.get('/analytics', authenticate, authorize(...ADMIN_ROLES), ctrl.getAnalytics);

module.exports = router;
