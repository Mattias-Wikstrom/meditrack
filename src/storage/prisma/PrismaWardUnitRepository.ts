import { PrismaClient } from '@prisma/client';
import { WardUnit } from '../../domain/wardUnit/WardUnit';
import { WardUnitRepository } from '../../domain/wardUnit/WardUnitRepository';
import { WardUnitId } from '../../domain/shared/IdTypes';

type WardUnitRow = { id: string; name: string };

function toDomain(row: WardUnitRow): WardUnit {
  return new WardUnit(row.id as WardUnitId, row.name);
}

export class PrismaWardUnitRepository implements WardUnitRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: WardUnitId): Promise<WardUnit | undefined> {
    const row = await this.prisma.wardUnit.findUnique({ where: { id } });
    return row ? toDomain(row) : undefined;
  }

  async findAll(): Promise<WardUnit[]> {
    const rows = await this.prisma.wardUnit.findMany();
    return rows.map(toDomain);
  }

  async save(wardUnit: WardUnit): Promise<void> {
    await this.prisma.wardUnit.upsert({
      where: { id: wardUnit.id },
      create: { id: wardUnit.id, name: wardUnit.name },
      update: { name: wardUnit.name },
    });
  }
}
