/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query NurseWardUnitName($id: ID!) {\n    wardUnit(id: $id) { id name }\n  }\n": typeof types.NurseWardUnitNameDocument,
    "\n  query NurseWardUnitOrders($wardUnitId: ID!) {\n    wardUnit(id: $wardUnitId) {\n      id\n      orders {\n        id status createdAt\n        lines { medicationId quantity medication { innName } }\n      }\n    }\n  }\n": typeof types.NurseWardUnitOrdersDocument,
    "\n  subscription NurseOrderDraftCreated {\n    orderDraftCreated { orderId }\n  }\n": typeof types.NurseOrderDraftCreatedDocument,
    "\n  subscription NurseOrderDraftUpdated {\n    orderDraftUpdated { orderId }\n  }\n": typeof types.NurseOrderDraftUpdatedDocument,
    "\n  subscription NurseOrderStatusChanged {\n    orderStatusChanged { orderId from to }\n  }\n": typeof types.NurseOrderStatusChangedDocument,
    "\n  query SearchMedications($query: String) {\n    medications(query: $query) { id innName atcCode form strength }\n  }\n": typeof types.SearchMedicationsDocument,
    "\n  query NurseOrder($id: ID!) {\n    order(id: $id) {\n      id wardUnitId wardUnit { name } status createdAt\n      lines { medicationId quantity medication { innName strength } }\n    }\n  }\n": typeof types.NurseOrderDocument,
    "\n  query NurseOrderDetailMedications($query: String) {\n    medications(query: $query) { id innName atcCode form strength }\n  }\n": typeof types.NurseOrderDetailMedicationsDocument,
    "\n  query NurseOverview($wardUnitId: ID!) {\n    wardUnit(id: $wardUnitId) {\n      orders { id status }\n    }\n  }\n": typeof types.NurseOverviewDocument,
    "\n  subscription NurseOverviewStatusChanged {\n    orderStatusChanged { orderId from to }\n  }\n": typeof types.NurseOverviewStatusChangedDocument,
    "\n  subscription NurseOverviewDraftCreated {\n    orderDraftCreated { orderId }\n  }\n": typeof types.NurseOverviewDraftCreatedDocument,
};
const documents: Documents = {
    "\n  query NurseWardUnitName($id: ID!) {\n    wardUnit(id: $id) { id name }\n  }\n": types.NurseWardUnitNameDocument,
    "\n  query NurseWardUnitOrders($wardUnitId: ID!) {\n    wardUnit(id: $wardUnitId) {\n      id\n      orders {\n        id status createdAt\n        lines { medicationId quantity medication { innName } }\n      }\n    }\n  }\n": types.NurseWardUnitOrdersDocument,
    "\n  subscription NurseOrderDraftCreated {\n    orderDraftCreated { orderId }\n  }\n": types.NurseOrderDraftCreatedDocument,
    "\n  subscription NurseOrderDraftUpdated {\n    orderDraftUpdated { orderId }\n  }\n": types.NurseOrderDraftUpdatedDocument,
    "\n  subscription NurseOrderStatusChanged {\n    orderStatusChanged { orderId from to }\n  }\n": types.NurseOrderStatusChangedDocument,
    "\n  query SearchMedications($query: String) {\n    medications(query: $query) { id innName atcCode form strength }\n  }\n": types.SearchMedicationsDocument,
    "\n  query NurseOrder($id: ID!) {\n    order(id: $id) {\n      id wardUnitId wardUnit { name } status createdAt\n      lines { medicationId quantity medication { innName strength } }\n    }\n  }\n": types.NurseOrderDocument,
    "\n  query NurseOrderDetailMedications($query: String) {\n    medications(query: $query) { id innName atcCode form strength }\n  }\n": types.NurseOrderDetailMedicationsDocument,
    "\n  query NurseOverview($wardUnitId: ID!) {\n    wardUnit(id: $wardUnitId) {\n      orders { id status }\n    }\n  }\n": types.NurseOverviewDocument,
    "\n  subscription NurseOverviewStatusChanged {\n    orderStatusChanged { orderId from to }\n  }\n": types.NurseOverviewStatusChangedDocument,
    "\n  subscription NurseOverviewDraftCreated {\n    orderDraftCreated { orderId }\n  }\n": types.NurseOverviewDraftCreatedDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query NurseWardUnitName($id: ID!) {\n    wardUnit(id: $id) { id name }\n  }\n"): (typeof documents)["\n  query NurseWardUnitName($id: ID!) {\n    wardUnit(id: $id) { id name }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query NurseWardUnitOrders($wardUnitId: ID!) {\n    wardUnit(id: $wardUnitId) {\n      id\n      orders {\n        id status createdAt\n        lines { medicationId quantity medication { innName } }\n      }\n    }\n  }\n"): (typeof documents)["\n  query NurseWardUnitOrders($wardUnitId: ID!) {\n    wardUnit(id: $wardUnitId) {\n      id\n      orders {\n        id status createdAt\n        lines { medicationId quantity medication { innName } }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription NurseOrderDraftCreated {\n    orderDraftCreated { orderId }\n  }\n"): (typeof documents)["\n  subscription NurseOrderDraftCreated {\n    orderDraftCreated { orderId }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription NurseOrderDraftUpdated {\n    orderDraftUpdated { orderId }\n  }\n"): (typeof documents)["\n  subscription NurseOrderDraftUpdated {\n    orderDraftUpdated { orderId }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription NurseOrderStatusChanged {\n    orderStatusChanged { orderId from to }\n  }\n"): (typeof documents)["\n  subscription NurseOrderStatusChanged {\n    orderStatusChanged { orderId from to }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SearchMedications($query: String) {\n    medications(query: $query) { id innName atcCode form strength }\n  }\n"): (typeof documents)["\n  query SearchMedications($query: String) {\n    medications(query: $query) { id innName atcCode form strength }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query NurseOrder($id: ID!) {\n    order(id: $id) {\n      id wardUnitId wardUnit { name } status createdAt\n      lines { medicationId quantity medication { innName strength } }\n    }\n  }\n"): (typeof documents)["\n  query NurseOrder($id: ID!) {\n    order(id: $id) {\n      id wardUnitId wardUnit { name } status createdAt\n      lines { medicationId quantity medication { innName strength } }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query NurseOrderDetailMedications($query: String) {\n    medications(query: $query) { id innName atcCode form strength }\n  }\n"): (typeof documents)["\n  query NurseOrderDetailMedications($query: String) {\n    medications(query: $query) { id innName atcCode form strength }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query NurseOverview($wardUnitId: ID!) {\n    wardUnit(id: $wardUnitId) {\n      orders { id status }\n    }\n  }\n"): (typeof documents)["\n  query NurseOverview($wardUnitId: ID!) {\n    wardUnit(id: $wardUnitId) {\n      orders { id status }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription NurseOverviewStatusChanged {\n    orderStatusChanged { orderId from to }\n  }\n"): (typeof documents)["\n  subscription NurseOverviewStatusChanged {\n    orderStatusChanged { orderId from to }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription NurseOverviewDraftCreated {\n    orderDraftCreated { orderId }\n  }\n"): (typeof documents)["\n  subscription NurseOverviewDraftCreated {\n    orderDraftCreated { orderId }\n  }\n"];

export function graphql(source: string) {
  const doc = (documents as any)[source];
  if (doc === undefined) {
    throw new Error(
      'GraphQL operation not found in generated types — run "npm run codegen".\n' +
      `Source: ${(source as string).trim().slice(0, 120)}`,
    );
  }
  return doc;
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;