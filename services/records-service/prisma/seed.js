const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Records DB...');

  const patientDid = 'did:ethr:afrihealth:patient:test-frederic';
  const doctorDid = 'did:ethr:afrihealth:doctor:test-russel';
  const facilityId = 'afrihealth-general-hospital';

  // 1. Create an Encounter
  const encounter = await prisma.encounter.create({
    data: {
      patientDid,
      providerDid: doctorDid,
      facilityId,
      encounterType: 'OUTPATIENT',
      chiefComplaint: 'Routine health checkup',
      notes: 'Patient appears healthy.',
      vitals: {
        create: [
          {
            patientDid,
            weightKg: 75.5,
            heightCm: 180,
            bmi: 23.3,
            bloodPressure: '120/80',
            temperatureC: 36.6,
            pulseRate: 72,
            respiratoryRate: 16,
            oxygenSat: 98,
            recordedBy: doctorDid
          }
        ]
      },
      diagnoses: {
        create: [
          {
            patientDid,
            icd10Code: 'Z00.00',
            description: 'Encounter for general adult medical examination',
            status: 'ACTIVE',
            diagnosedBy: doctorDid
          }
        ]
      },
      prescriptions: {
        create: [
          {
            patientDid,
            drugName: 'Vitamin C',
            dosage: '500mg',
            frequency: 'Once daily',
            durationDays: 30,
            instructions: 'Take after breakfast',
            prescribedBy: doctorDid
          }
        ]
      }
    }
  });

  console.log('Created Initial Encounter for Patient:', encounter.patientDid);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
