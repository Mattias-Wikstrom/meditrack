export type ErrorCode =
  | 'ActorNotFound'
  | 'UnauthorizedRole'
  | 'OrderHasAtLeastOneLine'
  | 'OrderLineQuantitiesPositive'
  | 'OrderNotFound'
  | 'InvalidStatusTransition'
  | 'MedicinalProductNotFound'
  | 'ProductMedicationMismatch'
  | 'SelectionQuantityMismatch'
  | 'InsufficientStock'
  | 'InvalidQuantity';
