const repo = require('../repositories/records.repository');
const { AppError } = require('../middleware/errorHandler');

// ── Encounters ────────────────────────────────────────────────────────────────
const createEncounter = (providerDid, data) =>
  repo.createEncounter({ ...data, providerDid });

const getEncounter = async (id) => {
  const e = await repo.findEncounterById(id);
  if (!e) throw new AppError('Encounter not found', 404, 'NOT_FOUND');
  return e;
};

const getPatientRecords = (patientDid) => repo.listEncountersByPatient(patientDid);

// ── Diagnoses ─────────────────────────────────────────────────────────────────
const addDiagnosis = (providerDid, data) =>
  repo.createDiagnosis({ ...data, diagnosedBy: providerDid });

const getPatientDiagnoses = (patientDid) => repo.listDiagnosesByPatient(patientDid);

// ── Prescriptions ─────────────────────────────────────────────────────────────
const createPrescription = (providerDid, data) =>
  repo.createPrescription({ ...data, prescribedBy: providerDid });

const getPatientPrescriptions = (patientDid) => repo.listPrescriptionsByPatient(patientDid);

const dispensePrescription = async (id, providerDid) => {
  return repo.dispensePrescription(id, providerDid);
};

// ── Vitals ────────────────────────────────────────────────────────────────────
const recordVitals = (providerDid, data) => {
  // Compute BMI if height and weight are provided
  let bmi = undefined;
  if (data.heightCm && data.weightKg) {
    const hm = data.heightCm / 100;
    bmi = parseFloat((data.weightKg / (hm * hm)).toFixed(2));
  }
  return repo.createVitals({ ...data, bmi, recordedBy: providerDid });
};

const getLatestVitals = (patientDid) => repo.latestVitals(patientDid);
const getVitalsHistory = (patientDid) => repo.vitalsHistory(patientDid);

// ── Timeline ──────────────────────────────────────────────────────────────────
const getTimeline = async (patientDid) => {
  const [encounters, diagnoses, prescriptions, vitals] = await Promise.all([
    repo.listEncountersByPatient(patientDid),
    repo.listDiagnosesByPatient(patientDid),
    repo.listPrescriptionsByPatient(patientDid),
    repo.vitalsHistory(patientDid),
  ]);
  return { patientDid, encounters, diagnoses, prescriptions, vitals };
};

// ── Summary ───────────────────────────────────────────────────────────────────
const getSummary = async (patientDid) => {
  const [encounters, diagnoses, prescriptions, latestVitalsData] = await Promise.all([
    repo.listEncountersByPatient(patientDid),
    repo.listDiagnosesByPatient(patientDid),
    repo.listPrescriptionsByPatient(patientDid),
    repo.latestVitals(patientDid),
  ]);
  const lastVisit = encounters[0]?.encounterDate ?? null;
  const activeConditions = diagnoses.filter((d) => d.status === 'ACTIVE' || d.status === 'CHRONIC').map((d) => d.description);
  const activePrescriptions = prescriptions.filter((p) => !p.dispensed).map((p) => p.drugName);
  return { patientDid, totalVisits: encounters.length, lastVisit, activeConditions, activePrescriptions, latestVitals: latestVitalsData };
};

// ── Documents ─────────────────────────────────────────────────────────────────
const uploadDocument = (uploaderDid, data) =>
  repo.createDocument({ ...data, uploadedBy: uploaderDid });

const getPatientDocuments = (patientDid) => repo.listDocumentsByPatient(patientDid);

// ── Provider records ──────────────────────────────────────────────────────────
const getProviderRecordsAlias = (providerDid) => repo.getProviderRecords(providerDid);

// ── Provider records ──────────────────────────────────────────────────────────
const getProviderRecords = (providerDid) => repo.getProviderRecords(providerDid);

// ── Analytics ─────────────────────────────────────────────────────────────────
const getAnalytics = () => repo.getAnalytics();

module.exports = {
  createEncounter, getEncounter, getPatientRecords,
  addDiagnosis, getPatientDiagnoses,
  createPrescription, getPatientPrescriptions, dispensePrescription,
  recordVitals, getLatestVitals, getVitalsHistory,
  getTimeline, getSummary,
  uploadDocument, getPatientDocuments,
  getProviderRecords,
  getAnalytics,
};
