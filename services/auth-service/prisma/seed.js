const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Auth DB...');
  const passwordHash = await bcrypt.hash('Hello@94fbr', 10);

  // 1. Create Patient User
  const patient = await prisma.user.upsert({
    where: { email: 'noafrederic91@gmail.com' },
    update: {
      firstName: 'Frederic',
      lastName: 'Abel',
    },
    create: {
      email: 'noafrederic91@gmail.com',
      password: passwordHash,
      role: 'PATIENT',
      firstName: 'Frederic',
      lastName: 'Abel',
      did: `did:ethr:afrihealth:patient:test-frederic`,
      isActive: true,
      isVerified: true,
    },
  });
  console.log('Created Patient User:', patient.email, patient.did);

  // 2. Create Doctor User
  const doctor = await prisma.user.upsert({
    where: { email: 'ngurusel@gmail.com' },
    update: {
      firstName: 'Russel',
      lastName: 'Doctor',
    },
    create: {
      email: 'ngurusel@gmail.com',
      password: passwordHash,
      role: 'DOCTOR',
      firstName: 'Russel',
      lastName: 'Doctor',
      did: `did:ethr:afrihealth:doctor:test-russel`,
      isActive: true,
      isVerified: true,
    },
  });
  console.log('Created Doctor User:', doctor.email, doctor.did);

  // 3. Create Super Admin User
  const superAdmin = await prisma.user.upsert({
    where: { email: 'medichain@admin.com' },
    update: {
      firstName: 'MediChain',
      lastName: 'SuperAdmin',
      role: 'SUPER_ADMIN',
    },
    create: {
      email: 'medichain@admin.com',
      password: passwordHash,
      role: 'SUPER_ADMIN',
      firstName: 'MediChain',
      lastName: 'SuperAdmin',
      did: 'did:medichain:admin:super-admin',
      isActive: true,
      isVerified: true,
    },
  });
  console.log('Created Super Admin User:', superAdmin.email, superAdmin.did);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
