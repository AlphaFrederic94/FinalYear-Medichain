const svc = require('../services/blockchain.service');

const wrap = (fn) => async (req, res, next) => {
  try {
    res.json({ success: true, data: await fn(req, res) });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  anchorRecord: wrap((req) =>
    svc.anchorRecord(
      req.body.patientDid,
      req.body.recordId,
      req.body.recordType,
      req.user.did,
      req.body.recordPayload
    )
  ),

  verifyRecord: wrap((req) =>
    svc.verifyRecord(req.params.recordId, req.body.currentPayload)
  ),

  grantConsent: wrap((req) =>
    svc.grantConsent(
      req.user.did, // Patient DID from authentication token
      req.body.providerDid,
      req.body.scopes,
      req.body.expiresAt,
      req.body.purpose
    )
  ),

  revokeConsent: wrap((req) =>
    svc.revokeConsent(req.user.did, req.body.providerDid)
  ),

  checkConsent: wrap((req) =>
    svc.checkConsent(req.query.patientDid, req.query.providerDid)
  ),

  logAccess: wrap((req) =>
    svc.logAccess(
      req.user.did,
      req.body.patientDid,
      req.body.recordId,
      req.body.action
    )
  ),

  getAuditTrail: wrap((req) => svc.getAuditTrail(req.params.patientDid)),

  getConsentHistory: wrap((req) => svc.getConsentHistory(req.params.patientDid)),

  getBlocks: wrap(() => svc.getBlocks()),

  validateChain: wrap(() => svc.validateChain()),
};
