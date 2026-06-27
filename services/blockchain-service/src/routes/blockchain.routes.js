const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/blockchain.controller');
const { authenticate } = require('../middleware/authenticate');

// Anchoring & Verification
router.post('/anchor', authenticate, ctrl.anchorRecord);
router.post('/verify/:recordId', authenticate, ctrl.verifyRecord);

// Consent Management
router.post('/consents', authenticate, ctrl.grantConsent);
router.delete('/consents', authenticate, ctrl.revokeConsent);
router.get('/consents/check', authenticate, ctrl.checkConsent);
router.get('/consents/history/:patientDid', authenticate, ctrl.getConsentHistory);

// Access Auditing
router.post('/access/log', authenticate, ctrl.logAccess);
router.get('/audit/:patientDid', authenticate, ctrl.getAuditTrail);

// System / Admin utilities
router.get('/blocks', authenticate, ctrl.getBlocks);
router.get('/logs', authenticate, ctrl.getAllLogs);
router.get('/validate', authenticate, ctrl.validateChain);

module.exports = router;
