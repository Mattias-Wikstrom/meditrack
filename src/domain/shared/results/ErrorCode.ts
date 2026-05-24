export type ErrorCode =
  | 'OrderHasAtLeastOneLine'
  | 'OrderLineQuantitiesPositive'
  | 'OrderNotFound'
  | 'InvalidStatusTransition'
  | 'MedicinalProductNotFound'
  | 'MissingProductSelection'
  | 'ProductMedicationMismatch';
