import { ErrorCode } from '../../domain/shared/results/ErrorCode';

export const errorMessages: Record<ErrorCode, string> = {
  ActorNotFound: 'Actor not found. Check that --actor-id is correct.',
  UnauthorizedRole: 'Your role does not permit this action.',
  ActorNotAssignedToWardUnit: 'Your account is not assigned to a ward unit.',
  OrderHasAtLeastOneLine: 'An order must have at least one line.',
  OrderLineQuantitiesPositive: 'All line quantities must be greater than zero.',
  OrderNotFound: 'Order not found. Check that the order ID is correct.',
  InvalidStatusTransition: 'The order is not in the right status for this action.',
  MedicinalProductNotFound: 'One or more medicinal products were not found.',
  ProductMedicationMismatch: 'A selected product does not match the medication on the order line.',
  SelectionQuantityMismatch: 'The selected quantities do not match the ordered quantities.',
  InsufficientStock: 'Insufficient stock to fulfil this order.',
  InvalidQuantity: 'Quantity must be greater than zero.',
};
