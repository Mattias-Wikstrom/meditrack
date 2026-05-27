import { MedicationRepository } from '../../../domain/medication/MedicationRepository';
import { MedicinalProductRepository } from '../../../domain/medication/MedicinalProductRepository';
import { CreateMedicationUseCase } from '../../../domain/medication/useCases/CreateMedicationUseCase';
import { UpdateMedicationUseCase } from '../../../domain/medication/useCases/UpdateMedicationUseCase';
import { DeleteMedicationUseCase } from '../../../domain/medication/useCases/DeleteMedicationUseCase';
import { CreateMedicinalProductUseCase } from '../../../domain/medication/useCases/CreateMedicinalProductUseCase';
import { UpdateMedicinalProductUseCase } from '../../../domain/medication/useCases/UpdateMedicinalProductUseCase';
import { DeleteMedicinalProductUseCase } from '../../../domain/medication/useCases/DeleteMedicinalProductUseCase';
import { MedicationForm } from '../../../domain/medication/MedicationForm';
import { MedicationId, MedicinalProductId } from '../../../domain/shared/IdTypes';
import { CliOutput } from '../CliOutput';
import { errorMessages } from '../errorMessages';

export async function listMedications(
  repo: MedicationRepository,
  output: CliOutput,
  query?: string,
): Promise<void> {
  const medications = query ? await repo.search(query) : await repo.findAll();

  if (medications.length === 0) {
    output.print('No medications found.');
    return;
  }

  for (const med of medications) {
    output.print(`${med.id}  ${med.innName}  ${med.atcCode}  ${med.form}  ${med.strength}`);
  }
}

export async function showMedication(
  medicationRepo: MedicationRepository,
  medicinalProductRepo: MedicinalProductRepository,
  output: CliOutput,
  id: string,
): Promise<void> {
  const med = await medicationRepo.findById(id as MedicationId);
  if (med === undefined) {
    output.error(`Medication not found: ${id}`);
    output.exit(1);
  }

  output.print(`${med.innName} (${med.atcCode})`);
  output.print(`Form: ${med.form}   Strength: ${med.strength}`);

  const products = await medicinalProductRepo.findByMedicationId(med.id);
  if (products.length === 0) {
    output.print('No medicinal products registered.');
    return;
  }

  output.print('\nMedicinal products:');
  for (const p of products) {
    const warning = p.isBelowThreshold ? '  *** BELOW THRESHOLD ***' : '';
    output.print(`  ${p.id}  ${p.productName}  stock: ${p.stockLevel}${warning}`);
  }
}

export async function createMedication(
  useCase: CreateMedicationUseCase,
  output: CliOutput,
  requestingActorId: string,
  innName: string,
  atcCode: string,
  form: string,
  strength: string,
): Promise<void> {
  const result = await useCase.execute({
    requestingActorId,
    innName,
    atcCode,
    form: form as MedicationForm,
    strength,
  });
  if (result.successful) {
    output.print(`Medication created: ${result.value.id}  ${result.value.innName}  ${result.value.atcCode}`);
  } else {
    result.errors.forEach((e) => output.error(errorMessages[e.code] ?? e.code));
    output.exit(1);
  }
}

export async function updateMedication(
  useCase: UpdateMedicationUseCase,
  output: CliOutput,
  requestingActorId: string,
  id: string,
  opts: { innName?: string; atcCode?: string; form?: string; strength?: string },
): Promise<void> {
  const result = await useCase.execute({
    requestingActorId,
    id: id as MedicationId,
    innName: opts.innName,
    atcCode: opts.atcCode,
    form: opts.form as MedicationForm | undefined,
    strength: opts.strength,
  });
  if (result.successful) {
    output.print(`Medication updated: ${result.value.id}  ${result.value.innName}  ${result.value.atcCode}`);
  } else {
    result.errors.forEach((e) => output.error(errorMessages[e.code] ?? e.code));
    output.exit(1);
  }
}

export async function deleteMedication(
  useCase: DeleteMedicationUseCase,
  output: CliOutput,
  requestingActorId: string,
  id: string,
): Promise<void> {
  const result = await useCase.execute({ requestingActorId, id: id as MedicationId });
  if (result.successful) {
    output.print(`Medication deleted: ${id}`);
  } else {
    result.errors.forEach((e) => output.error(errorMessages[e.code] ?? e.code));
    output.exit(1);
  }
}

export async function addProduct(
  useCase: CreateMedicinalProductUseCase,
  output: CliOutput,
  requestingActorId: string,
  medicationId: string,
  productName: string,
  stockLevel: number,
  stockThreshold: number,
): Promise<void> {
  const result = await useCase.execute({
    requestingActorId,
    medicationId: medicationId as MedicationId,
    productName,
    stockLevel,
    stockThreshold,
  });
  if (result.successful) {
    output.print(`Product added: ${result.value.id}  ${result.value.productName}`);
  } else {
    result.errors.forEach((e) => output.error(errorMessages[e.code] ?? e.code));
    output.exit(1);
  }
}

export async function updateProduct(
  useCase: UpdateMedicinalProductUseCase,
  output: CliOutput,
  requestingActorId: string,
  id: string,
  opts: { productName?: string; stockThreshold?: number },
): Promise<void> {
  const result = await useCase.execute({
    requestingActorId,
    id: id as MedicinalProductId,
    productName: opts.productName,
    stockThreshold: opts.stockThreshold,
  });
  if (result.successful) {
    output.print(`Product updated: ${result.value.id}  ${result.value.productName}`);
  } else {
    result.errors.forEach((e) => output.error(errorMessages[e.code] ?? e.code));
    output.exit(1);
  }
}

export async function deleteProduct(
  useCase: DeleteMedicinalProductUseCase,
  output: CliOutput,
  requestingActorId: string,
  id: string,
): Promise<void> {
  const result = await useCase.execute({ requestingActorId, id: id as MedicinalProductId });
  if (result.successful) {
    output.print(`Product deleted: ${id}`);
  } else {
    result.errors.forEach((e) => output.error(errorMessages[e.code] ?? e.code));
    output.exit(1);
  }
}
