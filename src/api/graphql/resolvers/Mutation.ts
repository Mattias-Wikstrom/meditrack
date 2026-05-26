import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { GraphQLContext } from '../context';
import { MedicationId, MedicinalProductId, OrderId, WardUnitId } from '../../../domain/shared/IdTypes';
import { Medication } from '../../../domain/medication/Medication';
import { MedicationForm } from '../../../domain/medication/MedicationForm';
import { MedicinalProduct } from '../../../domain/medication/MedicinalProduct';
import { WardUnit } from '../../../domain/wardUnit/WardUnit';
import { Actor } from '../../../domain/shared/Actor';
import { ActorRole } from '../../../domain/shared/ActorRole';

export const Mutation = {
  createOrder: async (
    _: unknown,
    { lines }: { lines: { medicationId: string; quantity: number }[] },
    ctx: GraphQLContext,
  ) => {
    const result = await ctx.createOrderUseCase.execute({
      actorId: ctx.actorId,
      lines: lines.map((l) => ({ medicationId: l.medicationId as MedicationId, quantity: l.quantity })),
    });
    return result.successful
      ? { successful: true, order: result.value, errors: [] }
      : { successful: false, order: null, errors: result.errors.map((e) => e.code) };
  },

  updateOrderLines: async (
    _: unknown,
    { orderId, lines }: { orderId: string; lines: { medicationId: string; quantity: number }[] },
    ctx: GraphQLContext,
  ) => {
    const result = await ctx.updateOrderLinesUseCase.execute({
      actorId: ctx.actorId,
      orderId: orderId as OrderId,
      lines: lines.map((l) => ({ medicationId: l.medicationId as MedicationId, quantity: l.quantity })),
    });
    return result.successful
      ? { successful: true, order: result.value, errors: [] }
      : { successful: false, order: null, errors: result.errors.map((e) => e.code) };
  },

  sendOrder: async (_: unknown, { orderId }: { orderId: string }, ctx: GraphQLContext) => {
    const result = await ctx.sendOrderUseCase.execute({
      actorId: ctx.actorId,
      orderId: orderId as OrderId,
    });
    return result.successful
      ? { successful: true, order: result.value, errors: [] }
      : { successful: false, order: null, errors: result.errors.map((e) => e.code) };
  },

  confirmOrder: async (_: unknown, { orderId }: { orderId: string }, ctx: GraphQLContext) => {
    const result = await ctx.confirmOrderUseCase.execute({
      actorId: ctx.actorId,
      orderId: orderId as OrderId,
    });
    return result.successful
      ? { successful: true, order: result.value, errors: [] }
      : { successful: false, order: null, errors: result.errors.map((e) => e.code) };
  },

  deliverOrder: async (
    _: unknown,
    { orderId, productSelections }: { orderId: string; productSelections: { medicationId: string; medicinalProductId: string; quantity: number }[] },
    ctx: GraphQLContext,
  ) => {
    const result = await ctx.deliverOrderUseCase.execute({
      actorId: ctx.actorId,
      orderId: orderId as OrderId,
      productSelections: productSelections.map((s) => ({
        medicationId: s.medicationId as MedicationId,
        medicinalProductId: s.medicinalProductId as MedicinalProductId,
        quantity: s.quantity,
      })),
    });
    return result.successful
      ? { successful: true, order: result.value, errors: [] }
      : { successful: false, order: null, errors: result.errors.map((e) => e.code) };
  },

  restockProduct: async (
    _: unknown,
    { medicinalProductId, quantity }: { medicinalProductId: string; quantity: number },
    ctx: GraphQLContext,
  ) => {
    const result = await ctx.restockUseCase.execute({
      actorId: ctx.actorId,
      medicinalProductId: medicinalProductId as MedicinalProductId,
      quantity,
    });
    return result.successful
      ? { successful: true, product: result.value, errors: [] }
      : { successful: false, product: null, errors: result.errors.map((e) => e.code) };
  },

  // ── Medications ─────────────────────────────────────────────────────────────

  createMedication: async (
    _: unknown,
    args: { innName: string; atcCode: string; form: string; strength: string },
    ctx: GraphQLContext,
  ) => {
    const medication = new Medication(
      randomUUID() as MedicationId,
      args.innName,
      args.atcCode,
      args.form as MedicationForm,
      args.strength,
    );
    await ctx.medicationRepo.save(medication);
    return medication;
  },

  updateMedication: async (
    _: unknown,
    args: { id: string; innName?: string; atcCode?: string; form?: string; strength?: string },
    ctx: GraphQLContext,
  ) => {
    const existing = await ctx.medicationRepo.findById(args.id as MedicationId);
    if (!existing) throw new Error('Medication not found');
    const updated = new Medication(
      args.id as MedicationId,
      args.innName ?? existing.innName,
      args.atcCode ?? existing.atcCode,
      (args.form ?? existing.form) as MedicationForm,
      args.strength ?? existing.strength,
    );
    await ctx.medicationRepo.save(updated);
    return updated;
  },

  deleteMedication: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    const products = await ctx.medicinalProductRepo.findByMedicationId(id as MedicationId);
    if (products.length > 0) throw new Error('Cannot delete a medication that has products — delete its products first');
    await ctx.medicationRepo.delete(id as MedicationId);
    return true;
  },

  // ── Medicinal Products ───────────────────────────────────────────────────────

  createMedicinalProduct: async (
    _: unknown,
    args: { productName: string; medicationId: string; stockLevel: number; stockThreshold: number },
    ctx: GraphQLContext,
  ) => {
    const product = new MedicinalProduct(
      randomUUID() as MedicinalProductId,
      args.productName,
      args.medicationId as MedicationId,
      args.stockLevel,
      args.stockThreshold,
    );
    await ctx.medicinalProductRepo.save(product);
    return product;
  },

  updateMedicinalProduct: async (
    _: unknown,
    args: { id: string; productName?: string; stockThreshold?: number },
    ctx: GraphQLContext,
  ) => {
    const existing = await ctx.medicinalProductRepo.findById(args.id as MedicinalProductId);
    if (!existing) throw new Error('Product not found');
    const updated = new MedicinalProduct(
      args.id as MedicinalProductId,
      args.productName ?? existing.productName,
      existing.medicationId,
      existing.stockLevel,
      args.stockThreshold ?? existing.stockThreshold,
    );
    await ctx.medicinalProductRepo.save(updated);
    return updated;
  },

  deleteMedicinalProduct: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    await ctx.medicinalProductRepo.delete(id as MedicinalProductId);
    return true;
  },

  // ── Ward Units ───────────────────────────────────────────────────────────────

  createWardUnit: async (_: unknown, { name }: { name: string }, ctx: GraphQLContext) => {
    const wardUnit = new WardUnit(randomUUID() as WardUnitId, name);
    await ctx.wardUnitRepo.save(wardUnit);
    return wardUnit;
  },

  updateWardUnit: async (_: unknown, { id, name }: { id: string; name: string }, ctx: GraphQLContext) => {
    const existing = await ctx.wardUnitRepo.findById(id as WardUnitId);
    if (!existing) throw new Error('Ward unit not found');
    const updated = new WardUnit(id as WardUnitId, name);
    await ctx.wardUnitRepo.save(updated);
    return updated;
  },

  // ── Actors ───────────────────────────────────────────────────────────────────

  createActor: async (
    _: unknown,
    args: { id: string; role: string; wardUnitId?: string | null; password: string },
    ctx: GraphQLContext,
  ) => {
    const actor: Actor = {
      id: args.id,
      role: args.role as ActorRole,
      ...(args.wardUnitId != null && { wardUnitId: args.wardUnitId }),
    };
    await ctx.actorRepo.save(actor);
    const hash = await bcrypt.hash(args.password, 10);
    await ctx.credentialsRepo.setPasswordHash(args.id, hash);
    return actor;
  },

  updateActor: async (
    _: unknown,
    args: { id: string; role?: string | null; wardUnitId?: string | null },
    ctx: GraphQLContext,
  ) => {
    const existing = await ctx.actorRepo.findById(args.id);
    if (!existing) throw new Error('Actor not found');
    const newWardUnitId = args.wardUnitId !== undefined ? args.wardUnitId : existing.wardUnitId;
    const updated: Actor = {
      id: existing.id,
      role: (args.role != null ? args.role : existing.role) as ActorRole,
      ...(newWardUnitId != null && { wardUnitId: newWardUnitId }),
    };
    await ctx.actorRepo.save(updated);
    return updated;
  },

  deleteActor: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    await ctx.actorRepo.delete(id);
    return true;
  },
};
