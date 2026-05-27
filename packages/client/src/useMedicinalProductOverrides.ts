import { useState, useEffect } from 'react';
import { useSubscription } from 'urql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

export function useMedicinalProductOverrides<T extends { id: string }, TVariables>(
  subscriptionDoc: TypedDocumentNode<{ medicinalProductUpdated: T }, TVariables>,
): (products: T[]) => T[] {
  const [{ data }] = useSubscription({ query: subscriptionDoc });
  const update = data?.medicinalProductUpdated;
  const [overrides, setOverrides] = useState<Map<string, T>>(new Map());

  useEffect(() => {
    if (!update) return;
    setOverrides(prev => new Map(prev).set(update.id, update));
  }, [update]);

  return (products: T[]) => products.map(p => overrides.get(p.id) ?? p);
}
