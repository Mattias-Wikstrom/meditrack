import { createApiClient } from '@meditrack/client';

const { post } = createApiClient('pharmacist-sofia');

export interface ProductSelection {
  medicationId: string;
  medicinalProductId: string;
  quantity: number;
}

export const ordersApi = {
  confirm: (orderId: string) =>
    post(`/orders/${orderId}/confirm`),

  deliver: (orderId: string, productSelections: ProductSelection[]) =>
    post(`/orders/${orderId}/deliver`, { productSelections }),
};
