const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Encounters ────────────────────────────────────────────────────────────────
const createEncounter = (data) =>
  prisma.encounter.create({ data, include: { diagnoses: true, prescriptions: true, vitals: true, documents: true } });

const findEncounterById = (id) =>
  prisma.encounter.findUnique({ where: { id }, include: { diagnoses: true, prescriptions: true, vitals: true, documents: true } });

const listEncountersByPatient = (patientDid) =>
  prisma.encounter.findMany({
    where: { patientDid },
    include: { diagnoses: true, prescriptions: true, vitals: true, documents: true },
    orderBy: { encounterDate: 'desc' },
  });

// ── Diagnoses ─────────────────────────────────────────────────────────────────
const createDiagnosis = (data) => prisma.diagnosis.create({ data });
const listDiagnosesByPatient = (patientDid) =>
  prisma.diagnosis.findMany({ where: { patientDid }, orderBy: { createdAt: 'desc' } });

// ── Prescriptions ─────────────────────────────────────────────────────────────
const createPrescription = (data) => prisma.prescription.create({ data });
const listPrescriptionsByPatient = (patientDid) =>
  prisma.prescription.findMany({ where: { patientDid }, orderBy: { createdAt: 'desc' } });
const dispensePrescription = (id, dispensedBy) =>
  prisma.prescription.update({ where: { id }, data: { dispensed: true, dispensedAt: new Date(), dispensedBy } });

// ── Vitals ────────────────────────────────────────────────────────────────────
const createVitals = (data) => prisma.vitals.create({ data });
const latestVitals  = (patientDid) =>
  prisma.vitals.findFirst({ where: { patientDid }, orderBy: { recordedAt: 'desc' } });
const vitalsHistory = (patientDid) =>
  prisma.vitals.findMany({ where: { patientDid }, orderBy: { recordedAt: 'desc' } });

// ── Documents ─────────────────────────────────────────────────────────────────
const createDocument = (data) => prisma.document.create({ data });
const listDocumentsByPatient = (patientDid) =>
  prisma.document.findMany({ where: { patientDid }, orderBy: { uploadedAt: 'desc' } });

// ── Provider records (encounters the provider created) ────────────────────────
const getProviderRecordsBasic = async (providerDid) => {
  const [encounters, diagnoses, prescriptions, documents] = await Promise.all([
    prisma.encounter.findMany({
      where: { providerDid },
      orderBy: { encounterDate: 'desc' },
    }),
    prisma.diagnosis.findMany({
      where: { diagnosedBy: providerDid },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.prescription.findMany({
      where: { prescribedBy: providerDid },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.document.findMany({
      where: { uploadedBy: providerDid },
      orderBy: { uploadedAt: 'desc' },
    }),
  ]);
  return { encounters, diagnoses, prescriptions, documents, vitals: [] };
};

// ── Provider records ──────────────────────────────────────────────────────────
const getProviderRecords = async (providerDid) => {
  const [encounters, diagnoses, prescriptions, documents] = await Promise.all([
    prisma.encounter.findMany({
      where: { providerDid },
      include: { diagnoses: true, prescriptions: true, vitals: true, documents: true },
      orderBy: { encounterDate: 'desc' },
    }),
    prisma.diagnosis.findMany({ where: { diagnosedBy: providerDid }, orderBy: { createdAt: 'desc' } }),
    prisma.prescription.findMany({ where: { prescribedBy: providerDid }, orderBy: { createdAt: 'desc' } }),
    prisma.document.findMany({ where: { uploadedBy: providerDid }, orderBy: { uploadedAt: 'desc' } }),
  ]);
  return { encounters, diagnoses, prescriptions, documents, vitals: [] };
};

// ── Analytics ─────────────────────────────────────────────────────────────────
const getAnalytics = async () => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalEncounters,
    totalDiagnoses,
    totalPrescriptions,
    totalDocuments,
    encountersToday,
    visitTypeRaw,
    diagnosisRaw,
    monthlyRaw,
  ] = await Promise.all([
    prisma.encounter.count(),
    prisma.diagnosis.count(),
    prisma.prescription.count(),
    prisma.document.count(),
    prisma.encounter.count({ where: { encounterDate: { gte: startOfToday } } }),
    prisma.encounter.groupBy({ by: ['encounterType'], _count: { id: true } }),
    prisma.diagnosis.groupBy({ by: ['description'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 10 }),
    prisma.encounter.findMany({ select: { encounterDate: true }, orderBy: { encounterDate: 'asc' } }),
  ]);

  // Build visit-type breakdown
  const visitTypeBreakdown = visitTypeRaw.map((r) => ({
    name: r.encounterType.charAt(0) + r.encounterType.slice(1).toLowerCase(),
    value: r._count.id,
  }));

  // Build top diagnoses
  const topDiagnoses = diagnosisRaw.map((r) => ({
    name: r.description,
    count: r._count.id,
  }));

  // Build monthly encounter counts (last 7 months)
  const monthlyMap = new Map();
  for (const enc of monthlyRaw) {
    const key = enc.encounterDate.toISOString().slice(0, 7); // YYYY-MM
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
  }
  const encountersOverTime = Array.from(monthlyMap.entries())
    .slice(-7)
    .map(([month, count]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      count,
    }));

  return {
    totalEncounters,
    totalDiagnoses,
    totalPrescriptions,
    totalDocuments,
    encountersToday,
    visitTypeBreakdown,
    topDiagnoses,
    encountersOverTime,
  };
};

const updateEncounterBlockchain = (id, blockchainTxId, recordHash) =>
  prisma.encounter.update({ where: { id }, data: { blockchainTxId, recordHash } });

const updateDiagnosisBlockchain = (id, blockchainTxId, recordHash) =>
  prisma.diagnosis.update({ where: { id }, data: { blockchainTxId, recordHash } });

const updatePrescriptionBlockchain = (id, blockchainTxId, recordHash) =>
  prisma.prescription.update({ where: { id }, data: { blockchainTxId, recordHash } });

const updateVitalsBlockchain = (id, blockchainTxId, recordHash) =>
  prisma.vitals.update({ where: { id }, data: { blockchainTxId, recordHash } });

const updateDocumentBlockchain = (id, blockchainTxId, recordHash) =>
  prisma.document.update({ where: { id }, data: { blockchainTxId, recordHash } });

module.exports = {
  createEncounter, findEncounterById, listEncountersByPatient,
  createDiagnosis, listDiagnosesByPatient,
  createPrescription, listPrescriptionsByPatient, dispensePrescription,
  createVitals, latestVitals, vitalsHistory,
  createDocument, listDocumentsByPatient,
  getProviderRecords,
  getAnalytics,
  updateEncounterBlockchain,
  updateDiagnosisBlockchain,
  updatePrescriptionBlockchain,
  updateVitalsBlockchain,
  updateDocumentBlockchain,
};
