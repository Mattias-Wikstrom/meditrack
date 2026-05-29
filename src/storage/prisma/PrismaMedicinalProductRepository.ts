import { PrismaClient } from '@prisma/client';
import { MedicinalProduct } from '../../domain/medication/MedicinalProduct';
import { MedicinalProductRepository } from '../../domain/medication/MedicinalProductRepository';
import { MedicationId, MedicinalProductId } from '../../domain/shared/IdTypes';
import { ConflictError } from '../../domain/shared/ConflictError';

type MedicinalProductRow = {
  id: string;
  productName: string;
  medicationId: string;
  stockLevel: number;
  stockThreshold: number;
};

function toDomain(row: MedicinalProductRow): MedicinalProduct {
  return new MedicinalProduct(
    row.id as MedicinalProductId,
    row.productName,
    row.medicationId as MedicationId,
    row.stockLevel,
    row.stockThreshold,
  );
}

export class PrismaMedicinalProductRepository implements MedicinalProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: MedicinalProductId): Promise<MedicinalProduct | undefined> {
    const row = await this.prisma.medicinalProduct.findUnique({ where: { id } });
    return row ? toDomain(row) : undefined;
  }

  async findByMedicationId(medicationId: MedicationId): Promise<MedicinalProduct[]> {
    const rows = await this.prisma.medicinalProduct.findMany({ where: { medicationId } });
    return rows.map(toDomain);
  }

  async findAll(): Promise<MedicinalProduct[]> {
    const rows = await this.prisma.medicinalProduct.findMany();
    return rows.map(toDomain);
  }

  async save(product: MedicinalProduct): Promise<void> {
    await this.prisma.medicinalProduct.upsert({
      where: { id: product.id },
      create: {
        id: product.id,
        productName: product.productName,
        medicationId: product.medicationId,
        stockLevel: product.stockLevel,
        stockThreshold: product.stockThreshold,
      },
      update: {
        productName: product.productName,
        stockLevel: product.stockLevel,
        stockThreshold: product.stockThreshold,
      },
    });
  }

  async adjustStock(id: MedicinalProductId, newLevel: number, expectedLevel: number): Promise<void> {
    const { count } = await this.prisma.medicinalProduct.updateMany({
      where: { id, stockLevel: expectedLevel },
      data: { stockLevel: newLevel },
    });
    if (count === 0) throw new ConflictError();
  }

  async delete(id: MedicinalProductId): Promise<void> {
    await this.prisma.medicinalProduct.delete({ where: { id } });
  }
}
