import { PrismaClient } from '@prisma/client';
import { Medication } from '../../domain/medication/Medication';
import { MedicationRepository } from '../../domain/medication/MedicationRepository';
import { MedicationForm } from '../../domain/medication/MedicationForm';
import { MedicationId } from '../../domain/shared/IdTypes';

type MedicationRow = {
  id: string;
  innName: string;
  atcCode: string;
  form: string;
  strength: string;
};

function toDomain(row: MedicationRow): Medication {
  return new Medication(
    row.id as MedicationId,
    row.innName,
    row.atcCode,
    row.form as MedicationForm,
    row.strength,
  );
}

export class PrismaMedicationRepository implements MedicationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: MedicationId): Promise<Medication | undefined> {
    const row = await this.prisma.medication.findUnique({ where: { id } });
    return row ? toDomain(row) : undefined;
  }

  async findAll(): Promise<Medication[]> {
    const rows = await this.prisma.medication.findMany();
    return rows.map(toDomain);
  }

  async search(query: string): Promise<Medication[]> {
    const q = query.toLowerCase();
    const all = await this.findAll();
    return all.filter(
      (m) =>
        m.innName.toLowerCase().includes(q) ||
        m.atcCode.toLowerCase().includes(q) ||
        m.form.toLowerCase().includes(q),
    );
  }

  async save(medication: Medication): Promise<void> {
    await this.prisma.medication.upsert({
      where: { id: medication.id },
      create: {
        id: medication.id,
        innName: medication.innName,
        atcCode: medication.atcCode,
        form: medication.form,
        strength: medication.strength,
      },
      update: {
        innName: medication.innName,
        atcCode: medication.atcCode,
        form: medication.form,
        strength: medication.strength,
      },
    });
  }

  async delete(id: MedicationId): Promise<void> {
    await this.prisma.medication.delete({ where: { id } });
  }
}
