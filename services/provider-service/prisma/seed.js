const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Provider DB...');

  // 1. Create a Facility
  const facility = await prisma.facility.upsert({
    where: { id: 'afrihealth-general-hospital' },
    update: { name: 'AfriHealth General Hospital' },
    create: {
      id: 'afrihealth-general-hospital',
      name: 'AfriHealth General Hospital',
      facilityType: 'HOSPITAL',
      address: '123 Health Way, Lagos',
      phone: '+2348001112223',
    },
  });
  console.log('Created Facility:', facility.name);

  // 2. Create a Staff Member (The Doctor)
  const staff = await prisma.staff.upsert({
    where: { userDid: 'did:ethr:afrihealth:doctor:test-russel' },
    update: { firstName: 'Russel', lastName: 'Doctor' },
    create: {
      userDid: 'did:ethr:afrihealth:doctor:test-russel',
      firstName: 'Russel',
      lastName: 'Doctor',
      role: 'DOCTOR',
      specialty: 'General Practice',
      facilityId: facility.id,
      licenseNo: 'MD-123456',
    },
  });
  console.log('Created Staff Member:', staff.firstName, staff.lastName);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
