export type ErrorCode =
  | 'ActorNotFound'
  | 'UnauthorizedRole'
  | 'ActorNotAssignedToWardUnit'
  | 'WardUnitAssignmentNotAllowed'
  | 'OrderHasAtLeastOneLine'
  | 'OrderLineQuantitiesPositive'
  | 'OrderNotFound'
  | 'InvalidStatusTransition'
  | 'MedicinalProductNotFound'
  | 'ProductMedicationMismatch'
  | 'SelectionQuantityMismatch'
  | 'InsufficientStock'
  | 'InvalidQuantity';
