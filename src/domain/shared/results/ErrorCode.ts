export type ErrorCode =
  | 'ActorNotFound'
  | 'UnauthorizedRole'
  | 'ActorNotAssignedToWardUnit'
  | 'OrderHasAtLeastOneLine'
  | 'OrderLineQuantitiesPositive'
  | 'OrderNotFound'
  | 'InvalidStatusTransition'
  | 'MedicinalProductNotFound'
  | 'ProductMedicationMismatch'
  | 'SelectionQuantityMismatch'
  | 'InsufficientStock'
  | 'InvalidQuantity';
