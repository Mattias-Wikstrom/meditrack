import { useSubscription } from 'urql';
import { graphql } from './gql';

const STOCK_SYNC_SUB = graphql(`
  subscription NurseStockSync {
    medicinalProductUpdated {
      id productName stockLevel stockThreshold isBelowThreshold
    }
  }
`);

/** Mounts once to keep the graphcache subscription alive for all nurse pages. */
export function StockSync() {
  useSubscription({ query: STOCK_SYNC_SUB });
  return null;
}
