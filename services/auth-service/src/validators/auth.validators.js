const { z } = require('zod');

const registerPatientSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phone: z.string().optional(),
  countryCode: z.string().length(3).default('CMR'),
  gender: z.enum(['male', 'female', 'other']).optional(),
  nationalId: z.string().optional(),
});

const registerProviderSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phone: z.string().optional(),
  role: z.enum(['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'FACILITY_ADMIN']),
  licenseNo: z.string().optional(),
  specialty: z.string().optional(),
  facilityId: z.string().optional(),
  countryCode: z.string().length(3).default('CMR'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

module.exports = {
  registerPatientSchema,
  registerProviderSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
};
