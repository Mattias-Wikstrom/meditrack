import { MedicationForm } from './MedicationForm';
import { MedicationId } from '../shared/IdTypes';

export class Medication {
  public readonly id: MedicationId;

  /** The International Nonproprietary Name (INN) — the generic, non-brand name for the active substance. */
  public readonly innName: string;

  /** Anatomical Therapeutic Chemical classification code. See https://www.who.int/tools/atc-ddd-toolkit/atc-classification */
  public readonly atcCode: string;

  /** Tablet, Capsule, Injection, etc. */
  public readonly form: MedicationForm;

  /** Quantity of active ingredient per unit. Examples: "500mg" (tablet), "5mg/ml" (solution), "1%" (cream), "100mcg/dose" (inhaler). */
  public readonly strength: string;

  constructor(
    id: MedicationId,
    innName: string,
    atcCode: string,
    form: MedicationForm,
    strength: string,
  ) {
    this.id = id;
    this.innName = innName;
    this.atcCode = atcCode;
    this.form = form;
    this.strength = strength;
  }
}
