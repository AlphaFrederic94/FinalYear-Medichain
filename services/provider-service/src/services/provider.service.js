const repo = require('../repositories/provider.repository');
const { AppError } = require('../middleware/errorHandler');

// Facilities
const registerFacility = (data) => repo.createFacility(data);
const listFacilities   = () => repo.listFacilities();
const getFacility      = async (id) => {
  const f = await repo.findFacilityById(id);
  if (!f) throw new AppError('Facility not found', 404, 'NOT_FOUND');
  return f;
};

// Staff
const registerStaff = async (userDid, data) => {
  const existing = await repo.findStaffByDid(userDid);
  if (existing) throw new AppError('Staff profile already exists for this user', 409, 'ALREADY_EXISTS');
  return repo.createStaff({ userDid, ...data });
};

const getStaffByDid = async (did) => {
  const s = await repo.findStaffByDid(did);
  if (!s) throw new AppError('Staff profile not found', 404, 'NOT_FOUND');
  return s;
};

const updateStaff = async (did, data) => {
  await getStaffByDid(did);
  return repo.updateStaff(did, data);
};

const getMyProfile = async (userDid) => {
  const s = await repo.findStaffByDid(userDid);
  return s || null; // null = no staff profile yet (not an error)
};

const getSpecialties = () => repo.SPECIALTIES;
const getAnalytics   = () => repo.getAnalytics();

module.exports = {
  registerFacility, listFacilities, getFacility,
  registerStaff, getStaffByDid, updateStaff, getMyProfile, getSpecialties,
  getAnalytics,
};
