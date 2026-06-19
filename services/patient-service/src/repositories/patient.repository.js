const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Patient ───────────────────────────────────────────────────────────────────

const findByDid = (userDid) =>
  prisma.patient.findUnique({
    where: { userDid },
    include: { allergies: true, emergencyContacts: true },
  });

const findById = (id) =>
  prisma.patient.findUnique({
    where: { id },
    include: { allergies: true, emergencyContacts: true },
  });

const upsert = (userDid, data) =>
  prisma.patient.upsert({
    where: { userDid },
    create: { userDid, ...data },
    update: data,
  });

const search = ({ query, did, phone, name }) => {
  // DID lookup: exact match
  if (did) {
    return prisma.patient.findMany({ where: { userDid: did }, take: 5 });
  }

  // Build OR conditions from whichever fields are provided
  const term = query || name || phone || '';
  const conditions = [];
  if (query || name) {
    conditions.push(
      { firstName: { contains: term, mode: 'insensitive' } },
      { lastName:  { contains: term, mode: 'insensitive' } }
    );
  }
  if (query || phone) {
    conditions.push({ phone: { contains: term } });
  }
  if (query) {
    conditions.push({ nationalId: { contains: term } });
  }

  return prisma.patient.findMany({
    where: { OR: conditions.length ? conditions : [{ firstName: { contains: term, mode: 'insensitive' } }] },
    take: 20,
  });
};

// ── Allergies ─────────────────────────────────────────────────────────────────

const createAllergy = (patientId, data) =>
  prisma.allergy.create({ data: { patientId, ...data } });

const deleteAllergy = (id, patientId) =>
  prisma.allergy.deleteMany({ where: { id, patientId } });

const replaceAllergies = async (patientId, allergies) => {
  await prisma.allergy.deleteMany({ where: { patientId } });
  await prisma.allergy.createMany({
    data: allergies.map((a) => ({ patientId, ...a })),
  });
  return prisma.allergy.findMany({ where: { patientId } });
};

// ── Emergency Contacts ────────────────────────────────────────────────────────

const createEmergencyContact = (patientId, data) =>
  prisma.emergencyContact.create({ data: { patientId, ...data } });

const deleteEmergencyContact = (id, patientId) =>
  prisma.emergencyContact.deleteMany({ where: { id, patientId } });

const listEmergencyContacts = (patientId) =>
  prisma.emergencyContact.findMany({ where: { patientId } });

// ── Analytics ─────────────────────────────────────────────────────────────────
const getAnalytics = async () => {
  const [totalPatients, monthlyRaw] = await Promise.all([
    prisma.patient.count(),
    prisma.patient.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  // Monthly registration counts (last 7 months)
  const monthlyMap = new Map();
  for (const p of monthlyRaw) {
    const key = p.createdAt.toISOString().slice(0, 7);
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
  }
  const registrationsOverTime = Array.from(monthlyMap.entries())
    .slice(-7)
    .map(([month, count]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      count,
    }));

  return { totalPatients, registrationsOverTime };
};

module.exports = {
  findByDid,
  findById,
  upsert,
  search,
  createAllergy,
  deleteAllergy,
  replaceAllergies,
  createEmergencyContact,
  deleteEmergencyContact,
  listEmergencyContacts,
  getAnalytics,
};
