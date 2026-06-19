const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const { strictRateLimiter } = require('../middleware/rateLimiter');
const {
  registerPatientSchema,
  registerProviderSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} = require('../validators/auth.validators');

const router = express.Router();

/**
 * @openapi
 * /auth/register/patient:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new patient
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *     responses:
 *       201: { description: Success }
 */
router.post('/register/patient', validate(registerPatientSchema), authController.registerPatient);

/**
 * @openapi
 * /auth/register/provider:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new healthcare provider/staff
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *               role: { type: string, enum: [DOCTOR, NURSE, PHARMACIST, FACILITY_ADMIN] }
 *     responses:
 *       201: { description: Success }
 */
router.post('/register/provider', validate(registerProviderSchema), authController.registerProvider);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: User login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *     responses:
 *       200: { description: Success }
 */
router.post('/login', strictRateLimiter, validate(loginSchema), authController.login);
router.post('/token/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', validate(refreshTokenSchema), authController.logout);
/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current logged-in user info
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Success }
 */
router.get('/me', authenticate, authController.getMe);
router.put('/password/change', authenticate, validate(changePasswordSchema), authController.changePassword);

module.exports = router;
