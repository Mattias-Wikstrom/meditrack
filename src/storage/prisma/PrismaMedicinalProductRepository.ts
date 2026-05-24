import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { MedicinalProduct } from '../../domain/medication/MedicinalProduct';
import { MedicinalProductRepository } from '../../domain/medication/MedicinalProductRepository';
import { MedicationId, MedicinalProductId } from '../../domain/shared/IdTypes';

type MedicinalProductRow = {
  id: string;
  productName: string;
  medicationId: string;
  stockLevel: { toString(): string };
  stockThreshold: { toString(): string };
};

function toDomain(row: MedicinalProductRow): MedicinalProduct {
  return new MedicinalProduct(
    row.id as MedicinalProductId,
    row.productName,
    row.medicationId as MedicationId,
    new Decimal(row.stockLevel.toString()),
    new Decimal(row.stockThreshold.toString()),
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
        stockLevel: product.stockLevel.toString(),
        stockThreshold: product.stockThreshold.toString(),
      },
      update: {
        productName: product.productName,
        stockLevel: product.stockLevel.toString(),
        stockThreshold: product.stockThreshold.toString(),
      },
    });
  }

  async delete(id: MedicinalProductId): Promise<void> {
    await this.prisma.medicinalProduct.delete({ where: { id } });
  }
}
