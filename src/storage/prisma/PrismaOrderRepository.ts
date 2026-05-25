import { PrismaClient } from '@prisma/client';
import { Order } from '../../domain/order/Order';
import { OrderLine } from '../../domain/order/OrderLine';
import { OrderRepository } from '../../domain/order/OrderRepository';
import { OrderStatus } from '../../domain/order/OrderStatus';
import { MedicationId, OrderId, WardUnitId } from '../../domain/shared/IdTypes';

type OrderLineRow = {
  medicationId: string;
  quantity: number;
};

type OrderRow = {
  id: string;
  wardUnitId: string;
  status: string;
  createdAt: Date;
  lines: OrderLineRow[];
};

function lineToDomain(row: OrderLineRow): OrderLine {
  return new OrderLine(row.medicationId as MedicationId, row.quantity);
}

function toDomain(row: OrderRow): Order {
  return new Order(
    row.id as OrderId,
    row.wardUnitId as WardUnitId,
    row.lines.map(lineToDomain),
    row.status as OrderStatus,
    row.createdAt,
  );
}

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: OrderId): Promise<Order | undefined> {
    const row = await this.prisma.order.findUnique({
      where: { id },
      include: { lines: true },
    });
    return row ? toDomain(row) : undefined;
  }

  async findAll(): Promise<Order[]> {
    const rows = await this.prisma.order.findMany({ include: { lines: true } });
    return rows.map(toDomain);
  }

  async findByWardUnit(wardUnitId: WardUnitId): Promise<Order[]> {
    const rows = await this.prisma.order.findMany({
      where: { wardUnitId },
      include: { lines: true },
    });
    return rows.map(toDomain);
  }

  async save(order: Order): Promise<void> {
    await this.prisma.order.upsert({
      where: { id: order.id },
      create: {
        id: order.id,
        wardUnitId: order.wardUnitId,
        status: order.status,
        createdAt: order.createdAt,
      },
      update: {
        wardUnitId: order.wardUnitId,
        status: order.status,
      },
    });

    // Replace lines wholesale — they have no domain identity of their own.
    // The caller (PrismaTransactor) wraps this in a $transaction, so both
    // operations are atomic with the rest of the use case work.
    await this.prisma.orderLine.deleteMany({ where: { orderId: order.id } });
    if (order.lines.length > 0) {
      await this.prisma.orderLine.createMany({
        data: order.lines.map((line) => ({
          orderId: order.id,
          medicationId: line.medicationId,
          quantity: line.quantity,
        })),
      });
    }
  }
}
