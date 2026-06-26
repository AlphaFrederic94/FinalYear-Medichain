const { z } = require('zod');

const facilitySchema = z.object({
  name:           z.string().min(1).max(200),
  facilityType:   z.enum(['HOSPITAL', 'CLINIC', 'PHARMACY', 'LABORATORY', 'HEALTH_CENTER']),
  registrationNo: z.string().max(100).optional(),
  address:        z.string().max(255).optional(),
  city:           z.string().max(100).optional(),
  country:        z.string().max(10).default('CMR'),
  latitude:       z.number().optional(),
  longitude:      z.number().optional(),
  phone:          z.string().max(20).optional(),
  email:          z.string().email().optional(),
});

const staffSchema = z.object({
  firstName:  z.string().min(1).max(100),
  lastName:   z.string().min(1).max(100),
  role:       z.enum(['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'FACILITY_ADMIN']),
  specialty:  z.string().max(100).optional(),
  licenseNo:  z.string().max(100).optional(),
  facilityId: z.string().optional(),
  bio:        z.string().max(1000).optional(),
  phone:      z.string().max(20).optional(),
});

const updateStaffSchema = staffSchema.partial();

module.exports = { facilitySchema, staffSchema, updateStaffSchema };
