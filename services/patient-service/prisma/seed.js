const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Patient DB...');

  const patient = await prisma.patient.upsert({
    where: { userDid: 'did:ethr:afrihealth:patient:test-frederic' },
    update: {
      firstName: 'Frederic',
      lastName: 'Abel',
    },
    create: {
      userDid: 'did:ethr:afrihealth:patient:test-frederic',
      firstName: 'Frederic',
      lastName: 'Abel',
      dateOfBirth: new Date('1994-01-01'),
      gender: 'MALE',
      bloodGroup: 'O+',
      phone: '+2348000000000',
      address: 'Lagos, Nigeria',
      emergencyContacts: {
        create: [
          {
            name: 'Emergency Contact 1',
            relationship: 'SPOUSE',
            phone: '+2348000000001',
          }
        ]
      },
      allergies: {
        create: [
          {
            substance: 'Penicillin',
            severity: 'SEVERE',
            reaction: 'Anaphylaxis'
          }
        ]
      }
    },
  });
  console.log('Created Patient Profile:', patient.firstName, patient.lastName);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
