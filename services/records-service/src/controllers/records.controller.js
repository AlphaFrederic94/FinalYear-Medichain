const svc = require('../services/records.service');

const wrap = (fn) => async (req, res, next) => {
  try { res.json({ success: true, data: await fn(req) }); } catch (e) { next(e); }
};

module.exports = {
  // Encounters
  createEncounter:      wrap((req) => svc.createEncounter(req.headers.authorization, req.user.did, req.body)),
  getEncounter:         wrap((req) => svc.getEncounter(req.params.id)),
  getPatientRecords:    wrap((req) => svc.getPatientRecords(req.params.did)),

  // Diagnoses
  addDiagnosis:         wrap((req) => svc.addDiagnosis(req.headers.authorization, req.user.did, req.body)),
  getPatientDiagnoses:  wrap((req) => svc.getPatientDiagnoses(req.params.did)),

  // Prescriptions
  createPrescription:   wrap((req) => svc.createPrescription(req.headers.authorization, req.user.did, req.body)),
  getPatientPrescriptions: wrap((req) => svc.getPatientPrescriptions(req.params.did)),
  dispensePrescription: wrap((req) => svc.dispensePrescription(req.params.id, req.user.did)),

  // Vitals
  recordVitals:         wrap((req) => svc.recordVitals(req.headers.authorization, req.user.did, req.body)),
  getLatestVitals:      wrap((req) => svc.getLatestVitals(req.params.did)),
  getVitalsHistory:     wrap((req) => svc.getVitalsHistory(req.params.did)),

  // Timeline + Summary
  getTimeline:          wrap((req) => svc.getTimeline(req.params.did)),
  getSummary:           wrap((req) => svc.getSummary(req.params.did)),

  // Documents
  uploadDocument:       wrap((req) => svc.uploadDocument(req.headers.authorization, req.user, req.body)),
  getPatientDocuments:  wrap((req) => svc.getPatientDocuments(req.params.did)),

  // Provider records
  getProviderRecords:   wrap((req) => svc.getProviderRecords(req.params.did)),

  // Analytics
  getAnalytics:         wrap(() => svc.getAnalytics()),

  getAllPrescriptions:  wrap(() => svc.getAllPrescriptions()),
  getAllDiagnoses:      wrap(() => svc.getAllDiagnoses()),
};

