const svc = require('../services/patient.service');

const wrap = (fn) => async (req, res, next) => {
  try { res.json({ success: true, data: await fn(req, res) }); }
  catch (err) { next(err); }
};

const getMe         = wrap((req) => svc.getMyProfile(req.user.did));
const updateMe      = wrap((req) => svc.updateMyProfile(req.user.did, req.body));
const getByDid      = wrap((req) => svc.getPatientByDid(req.params.did));
const search        = wrap((req) => svc.searchPatients(req.body));
const getSummary    = wrap((req) => svc.getSummary(req.user.did));

const updateAllergies     = wrap((req) => svc.updateAllergies(req.user.did, req.body.allergies || []));
const listAllergies       = wrap((req) => svc.listAllergies(req.user.did));

const listContacts        = wrap((req) => svc.listEmergencyContacts(req.user.did));
const addContact          = wrap((req) => svc.addEmergencyContact(req.user.did, req.body));
const deleteContact       = async (req, res, next) => {
  try {
    await svc.deleteEmergencyContact(req.user.did, req.params.id);
    res.json({ success: true, data: { message: 'Contact removed' } });
  } catch (err) { next(err); }
};

const getAnalytics = wrap(() => svc.getAnalytics());
const updatePatientByDid = wrap((req) => svc.updatePatientByDid(req.params.did, req.body));

module.exports = {
  getMe, updateMe, getByDid, search, getSummary,
  updateAllergies, listAllergies,
  listContacts, addContact, deleteContact,
  getAnalytics,
  updatePatientByDid,
};
