const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Facilities ────────────────────────────────────────────────────────────────
const createFacility    = (data) => prisma.facility.create({ data });
const listFacilities    = (filters = {}) => prisma.facility.findMany({ where: { active: true, ...filters }, include: { staff: true } });
const findFacilityById  = (id) => prisma.facility.findUnique({ where: { id }, include: { staff: true } });

// ── Staff ─────────────────────────────────────────────────────────────────────
const createStaff       = (data) => prisma.staff.create({ data, include: { facility: true } });
const findStaffByDid    = (userDid) => prisma.staff.findUnique({ where: { userDid }, include: { facility: true } });
const findStaffById     = (id) => prisma.staff.findUnique({ where: { id }, include: { facility: true } });
const updateStaff       = (userDid, data) => prisma.staff.update({ where: { userDid }, data, include: { facility: true } });
const listStaffByFacility = (facilityId) => prisma.staff.findMany({ where: { facilityId }, include: { facility: true } });
const listStaff         = (filters = {}) => prisma.staff.findMany({ where: filters, include: { facility: true } });

const SPECIALTIES = [
  'General Practice', 'Internal Medicine', 'Pediatrics', 'Obstetrics & Gynecology',
  'Surgery', 'Orthopedics', 'Cardiology', 'Neurology', 'Psychiatry',
  'Ophthalmology', 'Dermatology', 'Radiology', 'Pathology', 'Emergency Medicine',
  'Anesthesiology', 'Oncology', 'Urology', 'Nephrology', 'Endocrinology',
];

// ── Analytics ─────────────────────────────────────────────────────────────────
const getAnalytics = async () => {
  const [totalFacilities, totalStaff, facilityTypeRaw, staffRoleRaw] = await Promise.all([
    prisma.facility.count({ where: { active: true } }),
    prisma.staff.count(),
    prisma.facility.groupBy({ by: ['facilityType'], _count: { id: true } }),
    prisma.staff.groupBy({ by: ['role'], _count: { id: true } }),
  ]);

  const facilityTypeBreakdown = facilityTypeRaw.map((r) => ({
    name: r.facilityType.charAt(0) + r.facilityType.slice(1).toLowerCase().replace('_', ' '),
    value: r._count.id,
  }));

  const staffRoleBreakdown = staffRoleRaw.map((r) => ({
    name: r.role.charAt(0) + r.role.slice(1).toLowerCase().replace('_', ' '),
    count: r._count.id,
  }));

  return { totalFacilities, totalStaff, facilityTypeBreakdown, staffRoleBreakdown };
};

module.exports = {
  createFacility, listFacilities, findFacilityById,
  createStaff, findStaffByDid, findStaffById, updateStaff, listStaffByFacility, listStaff,
  SPECIALTIES,
  getAnalytics,
};
