const { AppError } = require('./authenticate');

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
 * Usage: attach after authenticate. req.params.did = patientDid.
 */
const consentCheck = (req, res, next) => {
  const { role, did } = req.user;
  const patientDid = req.params.did || req.body.patientDid;

  // Patient can always access their own records
  if (role === 'PATIENT' && did === patientDid) return next();

  // Providers (doctors, nurses, pharmacists) can access any patient's records
  // In a full system this would check the ConsentContract on-chain.
  // For now: any verified provider JWT is sufficient.
  const PROVIDER_ROLES = ['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'FACILITY_ADMIN', 'MINISTRY_ADMIN', 'SUPER_ADMIN'];
  if (PROVIDER_ROLES.includes(role)) return next();

  return next(new AppError('Access denied: no consent for these records', 403, 'CONSENT_REQUIRED'));
};

module.exports = { authorize, consentCheck };
