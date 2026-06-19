const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/provider.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize }    = require('../middleware/authorize');
const { validate }     = require('../middleware/validate');
const { facilitySchema, staffSchema, updateStaffSchema } = require('../validators/provider.validators');

const ADMIN  = ['FACILITY_ADMIN', 'MINISTRY_ADMIN', 'SUPER_ADMIN'];
const STAFF  = ['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'FACILITY_ADMIN', 'MINISTRY_ADMIN', 'SUPER_ADMIN'];

// Specialties (public-ish)
// Specialties (public-ish)
/**
 * @openapi
 * /providers/specialties:
 *   get:
 *     tags: [Providers]
 *     summary: List all medical specialties
 *     responses:
 *       200: { description: Success }
 */
router.get('/specialties', authenticate, ctrl.getSpecialties);

// Facilities
/**
 * @openapi
 * /providers/facilities:
 *   post:
 *     tags: [Facilities]
 *     summary: Register a new health facility (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, facilityType, physicalAddress]
 *             properties:
 *               name: { type: string }
 *               facilityType: { type: string, enum: [HOSPITAL, CLINIC, HEALTH_CENTRE, PHARMACY, LABORATORY] }
 *               physicalAddress: { type: string }
 *               contactEmail: { type: string }
 *               phone: { type: string }
 *     responses:
 *       201: { description: Created }
 *   get:
 *     tags: [Facilities]
 *     summary: List all facilities
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Success }
 */
router.post('/facilities',    authenticate, authorize(...ADMIN), validate(facilitySchema), ctrl.registerFacility);
router.get('/facilities',     authenticate, ctrl.listFacilities);

/**
 * @openapi
 * /providers/facilities/{id}:
 *   get:
 *     tags: [Facilities]
 *     summary: Get facility details by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Success }
 */
router.get('/facilities/:id', authenticate, ctrl.getFacility);

// Own staff profile
/**
 * @openapi
 * /providers/me:
 *   get:
 *     tags: [Staff]
 *     summary: Get my own provider/staff profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Success }
 */
router.get('/me', authenticate, authorize(...STAFF), ctrl.getMyProfile);

// Staff
/**
 * @openapi
 * /providers/staff:
 *   post:
 *     tags: [Staff]
 *     summary: Create a new staff profile (linking user to facility)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userDid, facilityId, staffType, licenseNo]
 *             properties:
 *               userDid: { type: string }
 *               facilityId: { type: string, format: uuid }
 *               staffType: { type: string, enum: [DOCTOR, NURSE, PHARMACIST, LAB_TECHNICIAN, FACILITY_ADMIN, MINISTRY_ADMIN] }
 *               licenseNo: { type: string }
 *               specialty: { type: string }
 *     responses:
 *       201: { description: Created }
 */
router.post('/staff',        authenticate, authorize(...STAFF), validate(staffSchema), ctrl.registerStaff);

/**
 * @openapi
 * /providers/staff/{did}:
 *   get:
 *     tags: [Staff]
 *     summary: Get staff profile by user DID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Success }
 *   put:
 *     tags: [Staff]
 *     summary: Update staff/provider profile
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               specialty: { type: string }
 *               licenseNo: { type: string }
 *               bio: { type: string }
 *     responses:
 *       200: { description: Success }
 */
router.get('/staff/:did',    authenticate, ctrl.getStaffByDid);
router.put('/staff/:did',    authenticate, authorize(...STAFF), validate(updateStaffSchema), ctrl.updateStaff);

// ── Analytics ─────────────────────────────────────────────────────────────────
/**
 * @openapi
 * /providers/analytics:
 *   get:
 *     tags: [Analytics]
 *     summary: Get facility and staff analytics (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Success }
 */
router.get('/analytics', authenticate, authorize(...ADMIN), ctrl.getAnalytics);

module.exports = router;
