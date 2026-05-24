export type ErrorCode =
  | 'UnauthorizedRole'
  | 'OrderHasAtLeastOneLine'
  | 'OrderLineQuantitiesPositive'
  | 'OrderNotFound'
  | 'InvalidStatusTransition'
  | 'MedicinalProductNotFound'
  | 'ProductMedicationMismatch'
  | 'SelectionQuantityMismatch'
  | 'InsufficientStock';
