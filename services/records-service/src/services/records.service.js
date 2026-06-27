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

const getPatientRecords = async (patientDid) => {
  const [encounters, diagnoses, prescriptions, vitals, documents] = await Promise.all([
    repo.listEncountersByPatient(patientDid),
    repo.listDiagnosesByPatient(patientDid),
    repo.listPrescriptionsByPatient(patientDid),
    repo.vitalsHistory(patientDid),
    repo.listDocumentsByPatient(patientDid),
  ]);
  return { encounters, diagnoses, prescriptions, vitals, documents };
};

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
  const records = await getPatientRecords(patientDid);
  return { patientDid, ...records };
};

// ── Summary ───────────────────────────────────────────────────────────────────
const getSummary = async (patientDid) => {
  const [encounters, diagnoses, prescriptions, latestVitalsData, documents] = await Promise.all([
    repo.listEncountersByPatient(patientDid),
    repo.listDiagnosesByPatient(patientDid),
    repo.listPrescriptionsByPatient(patientDid),
    repo.latestVitals(patientDid),
    repo.listDocumentsByPatient(patientDid),
  ]);
  const lastVisit = encounters[0]?.encounterDate ?? null;
  const activeConditions = diagnoses.filter((d) => d.status === 'ACTIVE' || d.status === 'CHRONIC').map((d) => d.description);
  const activePrescriptions = prescriptions.filter((p) => !p.dispensed).map((p) => p.drugName);
  return { patientDid, totalVisits: encounters.length, lastVisit, activeConditions, activePrescriptions, documentsCount: documents.length, latestVitals: latestVitalsData };
};

// ── Documents ─────────────────────────────────────────────────────────────────
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;

const uploadDocument = async (token, uploader, data) => {
  if (uploader.role === 'PATIENT' && data.patientDid !== uploader.did) {
    throw new AppError('Patients can only upload documents to their own record', 403, 'FORBIDDEN');
  }
  if (!data.fileName || !data.storagePath || !data.patientDid) {
    throw new AppError('Document fileName, storagePath, and patientDid are required', 400, 'INVALID_DOCUMENT');
  }
  if (data.fileSize && data.fileSize > MAX_DOCUMENT_SIZE) {
    throw new AppError('Medical documents must be 5 MB or smaller', 400, 'FILE_TOO_LARGE');
  }
  const doc = await repo.createDocument({ ...data, uploadedBy: uploader.did });
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

const getAllPrescriptions = () => repo.listAllPrescriptions();
const getAllDiagnoses = () => repo.listAllDiagnoses();

module.exports = {
  createEncounter, getEncounter, getPatientRecords,
  addDiagnosis, getPatientDiagnoses,
  createPrescription, getPatientPrescriptions, dispensePrescription,
  recordVitals, getLatestVitals, getVitalsHistory,
  getTimeline, getSummary,
  uploadDocument, getPatientDocuments,
  getProviderRecords,
  getAnalytics,
  getAllPrescriptions,
  getAllDiagnoses,
};
