import { Medication as MedicationEntity } from '../../domain/medication/Medication';

export const Medication = {
  stockLevel: (med: MedicationEntity) => med.stockLevel.toNumber(),
  stockThreshold: (med: MedicationEntity) => med.stockThreshold.toNumber(),
};
