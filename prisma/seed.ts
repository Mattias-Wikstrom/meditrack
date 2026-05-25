import bcrypt from 'bcryptjs';
import { ActorRole, MedicationForm, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ── Actors ────────────────────────────────────────────────────────────────

  const passwordHash = await bcrypt.hash('password', 10);

  const actors = [
    { id: 'nurse-anna',       role: ActorRole.Nurse,      passwordHash },
    { id: 'nurse-erik',       role: ActorRole.Nurse,      passwordHash },
    { id: 'pharmacist-sofia', role: ActorRole.Pharmacist, passwordHash },
    { id: 'pharmacist-lars',  role: ActorRole.Pharmacist, passwordHash },
  ];

  for (const a of actors) {
    await prisma.actor.upsert({ where: { id: a.id }, create: a, update: a });
  }

  // ── Ward units ────────────────────────────────────────────────────────────

  const wardUnits = [
    { id: 'ward-akuten',   name: 'Akuten' },
    { id: 'ward-medicin',  name: 'Medicinavdelningen' },
    { id: 'ward-kirurgi',  name: 'Kirurgavdelningen' },
  ];

  for (const w of wardUnits) {
    await prisma.wardUnit.upsert({ where: { id: w.id }, create: w, update: w });
  }

  // ── Medications ───────────────────────────────────────────────────────────

  const medications = [
    { id: 'med-paracetamol',  innName: 'Paracetamol',  atcCode: 'N02BE01', form: MedicationForm.Tablet,    strength: '500 mg'  },
    { id: 'med-ibuprofen',    innName: 'Ibuprofen',    atcCode: 'M01AE01', form: MedicationForm.Tablet,    strength: '400 mg'  },
    { id: 'med-amoxicillin',  innName: 'Amoxicillin',  atcCode: 'J01CA04', form: MedicationForm.Capsule,   strength: '500 mg'  },
    { id: 'med-metformin',    innName: 'Metformin',    atcCode: 'A10BA02', form: MedicationForm.Tablet,    strength: '500 mg'  },
    { id: 'med-furosemide',   innName: 'Furosemide',   atcCode: 'C03CA01', form: MedicationForm.Tablet,    strength: '40 mg'   },
    { id: 'med-prednisolone', innName: 'Prednisolone', atcCode: 'H02AB06', form: MedicationForm.Tablet,    strength: '5 mg'    },
    { id: 'med-salbutamol',   innName: 'Salbutamol',   atcCode: 'R03AC02', form: MedicationForm.Inhaler,   strength: '100 mcg' },
  ];

  for (const m of medications) {
    await prisma.medication.upsert({ where: { id: m.id }, create: m, update: m });
  }

  // ── Medicinal products ────────────────────────────────────────────────────
  // stockLevel and stockThreshold are plain numbers here; Prisma accepts them
  // and stores them as Decimal(18,4).
  //
  // A few products are intentionally seeded below threshold so the
  // *** BELOW THRESHOLD *** warning shows up in 'medications show'.

  const products = [
    // Paracetamol — one healthy, one low
    { id: 'prod-alvedon-500',  productName: 'Alvedon 500 mg',       medicationId: 'med-paracetamol',  stockLevel: 240, stockThreshold: 50  },
    { id: 'prod-panodil-500',  productName: 'Panodil 500 mg',       medicationId: 'med-paracetamol',  stockLevel: 18,  stockThreshold: 50  },

    // Ibuprofen
    { id: 'prod-ibumetin-400', productName: 'Ibumetin 400 mg',      medicationId: 'med-ibuprofen',    stockLevel: 95,  stockThreshold: 30  },

    // Amoxicillin — below threshold
    { id: 'prod-amimox-500',   productName: 'Amimox 500 mg',        medicationId: 'med-amoxicillin',  stockLevel: 8,   stockThreshold: 20  },

    // Metformin
    { id: 'prod-glucophage',   productName: 'Glucophage 500 mg',    medicationId: 'med-metformin',    stockLevel: 310, stockThreshold: 100 },

    // Furosemide — below threshold
    { id: 'prod-furix-40',     productName: 'Furix 40 mg',          medicationId: 'med-furosemide',   stockLevel: 4,   stockThreshold: 25  },

    // Prednisolone
    { id: 'prod-prednisolon',  productName: 'Prednisolon 5 mg',     medicationId: 'med-prednisolone', stockLevel: 180, stockThreshold: 60  },

    // Salbutamol
    { id: 'prod-ventoline',    productName: 'Ventoline Evohaler',   medicationId: 'med-salbutamol',   stockLevel: 42,  stockThreshold: 15  },
  ];

  for (const p of products) {
    await prisma.medicinalProduct.upsert({ where: { id: p.id }, create: p, update: p });
  }

  console.log(
    `Seeded ${actors.length} actors, ${wardUnits.length} ward units, ${medications.length} medications, ${products.length} medicinal products.`,
  );
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
