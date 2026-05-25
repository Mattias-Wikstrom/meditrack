import { useMemo } from 'react';
import { useAuth, createApiClient } from '@meditrack/client';

export interface ProductSelection {
  medicationId: string;
  medicinalProductId: string;
  quantity: number;
}

export function useOrdersApi() {
  const { token } = useAuth();
  return useMemo(() => {
    const { post } = createApiClient(token!);
    return {
      confirm: (orderId: string) =>
        post(`/orders/${orderId}/confirm`),
      deliver: (orderId: string, productSelections: ProductSelection[]) =>
        post(`/orders/${orderId}/deliver`, { productSelections }),
    };
  }, [token]);
}
