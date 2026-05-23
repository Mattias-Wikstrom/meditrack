declare const __brand: unique symbol;
type Brand<T, B> = T & { readonly [__brand]: B };

export type MedicationId = Brand<string, 'MedicationId'>;
export type OrderId = Brand<string, 'OrderId'>;
export type WardUnitId = Brand<string, 'WardUnitId'>;
