const { AppError } = require('./authenticate');
const blockchainClient = require('../utils/blockchainClient');

/**
 * Checks that the requesting user has one of the allowed roles.
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
  if (!roles.includes(req.user.role)) return next(new AppError('Forbidden', 403, 'FORBIDDEN'));
  next();
};

/**
 * Checks that the doctor/provider is accessing their own patient's records
 * OR the requester is the patient themselves.
 * Enforces blockchain-based consent verification.
 */
const consentCheck = async (req, res, next) => {
  const { role, did } = req.user;
  const patientDid = req.params.did || req.body.patientDid;

  // Patient can always access their own records
  if (role === 'PATIENT' && did === patientDid) return next();

  // Providers (doctors, nurses, pharmacists) must check the ConsentContract on-chain
  const PROVIDER_ROLES = ['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'FACILITY_ADMIN', 'MINISTRY_ADMIN', 'SUPER_ADMIN'];
  if (PROVIDER_ROLES.includes(role)) {
    try {
      const token = req.headers.authorization;
      const hasConsent = await blockchainClient.checkConsent(token, patientDid, did);
      if (hasConsent) {
        // Log access audit trail on the blockchain
        await blockchainClient.logAccess(token, patientDid, req.params.id || 'all-records', 'READ').catch(() => {});
        return next();
      }
      // Super admin or emergency bypass
      if (role === 'SUPER_ADMIN' || req.headers['x-emergency-bypass'] === 'true') {
        await blockchainClient.logAccess(token, patientDid, req.params.id || 'all-records', 'EMERGENCY_READ').catch(() => {});
        return next();
      }
      return next(new AppError('Access denied: no active on-chain consent found', 403, 'CONSENT_REQUIRED'));
    } catch (err) {
      return next(new AppError(`Consent verification error: ${err.message}`, 403, 'CONSENT_ERROR'));
    }
  }

  return next(new AppError('Access denied: no consent for these records', 403, 'CONSENT_REQUIRED'));
};

module.exports = { authorize, consentCheck };
