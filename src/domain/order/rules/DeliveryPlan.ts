import { MedicationId } from '../../shared/IdTypes';
import { MedicinalProduct } from '../../medication/MedicinalProduct';
import { Order } from '../Order';

export interface ResolvedLine {
  medicationId: MedicationId;
  product: MedicinalProduct;
  quantity: number;
}

export interface DeliveryPlan {
  order: Order;
  resolvedLines: ResolvedLine[];
}
