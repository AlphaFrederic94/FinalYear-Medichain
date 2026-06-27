const svc = require('../services/provider.service');

const wrap = (fn) => async (req, res, next) => {
  try { res.json({ success: true, data: await fn(req) }); } catch (e) { next(e); }
};

module.exports = {
  // Facilities
  registerFacility: wrap((req) => svc.registerFacility(req.body)),
  listFacilities:   wrap(() => svc.listFacilities()),
  getFacility:      wrap((req) => svc.getFacility(req.params.id)),

  // Staff
  registerStaff:  wrap((req) => svc.registerStaff(req.user.did, req.body)),
  listStaff:      wrap(() => svc.listStaff()),
  getStaffByDid:  wrap((req) => svc.getStaffByDid(req.params.did)),
  updateStaff:    wrap((req) => svc.updateStaff(req.params.did, req.body)),
  getMyProfile:   wrap((req) => svc.getMyProfile(req.user.did)),
  getSpecialties: wrap(() => svc.getSpecialties()),

  // Analytics
  getAnalytics:   wrap(() => svc.getAnalytics()),
};
