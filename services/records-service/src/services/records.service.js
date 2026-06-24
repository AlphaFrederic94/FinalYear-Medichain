const repo = require('../repositories/records.repository');
const { AppError } = require('../middleware/errorHandler');
const blockchainClient = require('../utils/blockchainClient');

// ── Encounters ────────────────────────────────────────────────────────────────
const createEncounter = async (token, providerDid, data) => {
  const encounter = await repo.createEncounter({ ...data, providerDid });
  blockchainClient.anchorRecord(token, encounter.patientDid, encounter.id, 'ENCOUNTER', encounter)
    .then(async ({ txId, recordHash }) => {
      await repo.updateEncounterBlockchain(encounter.id, txId, recordHash).catch(() => {});
    })
    .catch((err) => console.error('Encounter anchoring failed:', err.message));
  return encounter;
};

const getEncounter = async (id) => {
  const e = await repo.findEncounterById(id);
  if (!e) throw new AppError('Encounter not found', 404, 'NOT_FOUND');
  return e;
};

const getPatientRecords = (patientDid) => repo.listEncountersByPatient(patientDid);

// ── Diagnoses ─────────────────────────────────────────────────────────────────
const addDiagnosis = async (token, providerDid, data) => {
  const diagnosis = await repo.createDiagnosis({ ...data, diagnosedBy: providerDid });
  blockchainClient.anchorRecord(token, diagnosis.patientDid, diagnosis.id, 'DIAGNOSIS', diagnosis)
    .then(async ({ txId, recordHash }) => {
      await repo.updateDiagnosisBlockchain(diagnosis.id, txId, recordHash).catch(() => {});
    })
    .catch((err) => console.error('Diagnosis anchoring failed:', err.message));
  return diagnosis;
};

const getPatientDiagnoses = (patientDid) => repo.listDiagnosesByPatient(patientDid);

// ── Prescriptions ─────────────────────────────────────────────────────────────
const createPrescription = async (token, providerDid, data) => {
  const rx = await repo.createPrescription({ ...data, prescribedBy: providerDid });
  blockchainClient.anchorRecord(token, rx.patientDid, rx.id, 'PRESCRIPTION', rx)
    .then(async ({ txId, recordHash }) => {
      await repo.updatePrescriptionBlockchain(rx.id, txId, recordHash).catch(() => {});
    })
    .catch((err) => console.error('Prescription anchoring failed:', err.message));
  return rx;
};

const getPatientPrescriptions = (patientDid) => repo.listPrescriptionsByPatient(patientDid);

const dispensePrescription = async (id, providerDid) => {
  return repo.dispensePrescription(id, providerDid);
};

// ── Vitals ────────────────────────────────────────────────────────────────────
const recordVitals = async (token, providerDid, data) => {
  // Compute BMI if height and weight are provided
  let bmi = undefined;
  if (data.heightCm && data.weightKg) {
    const hm = data.heightCm / 100;
    bmi = parseFloat((data.weightKg / (hm * hm)).toFixed(2));
  }
  const vitals = await repo.createVitals({ ...data, bmi, recordedBy: providerDid });
  blockchainClient.anchorRecord(token, vitals.patientDid, vitals.id, 'VITALS', vitals)
    .then(async ({ txId, recordHash }) => {
      await repo.updateVitalsBlockchain(vitals.id, txId, recordHash).catch(() => {});
    })
    .catch((err) => console.error('Vitals anchoring failed:', err.message));
  return vitals;
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
const uploadDocument = async (token, uploaderDid, data) => {
  const doc = await repo.createDocument({ ...data, uploadedBy: uploaderDid });
  blockchainClient.anchorRecord(token, doc.patientDid, doc.id, 'DOCUMENT', doc)
    .then(async ({ txId, recordHash }) => {
      await repo.updateDocumentBlockchain(doc.id, txId, recordHash).catch(() => {});
    })
    .catch((err) => console.error('Document anchoring failed:', err.message));
  return doc;
};

const getPatientDocuments = (patientDid) => repo.listDocumentsByPatient(patientDid);

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
