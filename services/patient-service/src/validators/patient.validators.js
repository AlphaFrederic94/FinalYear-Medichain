const { z } = require('zod');

const updateProfileSchema = z.object({
  firstName:   z.string().min(1).max(100).optional(),
  lastName:    z.string().min(1).max(100).optional(),
  dateOfBirth: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  gender:      z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  phone:       z.string().min(8).max(20).optional(),
  nationalId:  z.string().max(50).optional(),
  bloodGroup:  z.string().max(10).optional(),
  address:     z.string().max(255).optional(),
  city:        z.string().max(100).optional(),
  languagePref: z.string().max(10).optional(),
}).strict();

const allergySchema = z.object({
  substance: z.string().min(1).max(200),
  reaction:  z.string().max(500).optional(),
  severity:  z.enum(['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING']).default('MILD'),
});

const emergencyContactSchema = z.object({
  name:         z.string().min(1).max(100),
  phone:        z.string().min(8).max(20),
  relationship: z.string().max(50).optional(),
});

const searchSchema = z.object({
  query: z.string().min(1).max(100).optional(),
  phone: z.string().min(1).max(30).optional(),
  name:  z.string().min(1).max(200).optional(),
}).refine(
  (d) => d.query || d.phone || d.name,
  { message: 'At least one search parameter is required' }
);

module.exports = {
  updateProfileSchema,
  allergySchema,
  emergencyContactSchema,
  searchSchema,
};

