const repo = require('../repositories/patient.repository');
const { AppError } = require('../middleware/errorHandler');

const getOrCreate = async (userDid) => {
  let patient = await repo.findByDid(userDid);
  if (!patient) {
    patient = await repo.upsert(userDid, { firstName: '', lastName: '' });
    patient = await repo.findByDid(userDid);
  }
  return patient;
};

const getMyProfile = async (userDid) => {
  return getOrCreate(userDid);
};

const updateMyProfile = async (userDid, data) => {
  await getOrCreate(userDid);
  return repo.upsert(userDid, data);
};

const getPatientByDid = async (targetDid) => {
  const patient = await repo.findByDid(targetDid);
  if (!patient) throw new AppError('Patient not found', 404, 'NOT_FOUND');
  return patient;
};

const searchPatients = async (params) => {
  return repo.search(params);
};

const updateAllergies = async (userDid, allergies) => {
  const patient = await getOrCreate(userDid);
  return repo.replaceAllergies(patient.id, allergies);
};

const listAllergies = async (userDid) => {
  const patient = await getOrCreate(userDid);
  return patient.allergies;
};

const addEmergencyContact = async (userDid, data) => {
  const patient = await getOrCreate(userDid);
  return repo.createEmergencyContact(patient.id, data);
};

const listEmergencyContacts = async (userDid) => {
  const patient = await getOrCreate(userDid);
  return repo.listEmergencyContacts(patient.id);
};

const deleteEmergencyContact = async (userDid, contactId) => {
  const patient = await getOrCreate(userDid);
  const count = await repo.deleteEmergencyContact(contactId, patient.id);
  if (count.count === 0) throw new AppError('Contact not found', 404, 'NOT_FOUND');
};

const getSummary = async (userDid) => {
  const patient = await getOrCreate(userDid);
  return {
    userDid: patient.userDid,
    name: `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
    bloodGroup: patient.bloodGroup,
    allergies: patient.allergies.map((a) => ({ substance: a.substance, severity: a.severity })),
    emergencyContacts: patient.emergencyContacts,
  };
};

const getAnalytics = () => repo.getAnalytics();

module.exports = {
  getMyProfile,
  updateMyProfile,
  getPatientByDid,
  searchPatients,
  updateAllergies,
  listAllergies,
  addEmergencyContact,
  listEmergencyContacts,
  deleteEmergencyContact,
  getSummary,
  getAnalytics,
};
