import Decimal from 'decimal.js';
import { MedicationId } from '../../shared/IdTypes';
import { MedicinalProduct } from '../../medication/MedicinalProduct';
import { Order } from '../Order';

export interface ResolvedLine {
  medicationId: MedicationId;
  product: MedicinalProduct;
  quantity: Decimal;
}

export interface DeliveryPlan {
  order: Order;
  resolvedLines: ResolvedLine[];
}
