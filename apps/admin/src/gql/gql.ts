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
    "\n  query AdminAuditLog {\n    auditLog {\n      actorId\n      action\n      entityId\n      occurredAt\n    }\n  }\n": typeof types.AdminAuditLogDocument,
    "\n  query AdminMedications {\n    medicinalProducts {\n      id productName stockLevel stockThreshold isBelowThreshold\n      medication { id innName atcCode form strength }\n    }\n  }\n": typeof types.AdminMedicationsDocument,
    "\n  query AdminOrders {\n    orders {\n      id wardUnitId status createdAt\n      lines { medicationId quantity medication { innName } }\n    }\n  }\n": typeof types.AdminOrdersDocument,
    "\n  query AdminActors {\n    actors {\n      id\n      role\n      wardUnitId\n      wardUnit { name }\n    }\n  }\n": typeof types.AdminActorsDocument,
    "\n  query AdminWardUnits {\n    wardUnits {\n      id\n      name\n    }\n  }\n": typeof types.AdminWardUnitsDocument,
};
const documents: Documents = {
    "\n  query AdminAuditLog {\n    auditLog {\n      actorId\n      action\n      entityId\n      occurredAt\n    }\n  }\n": types.AdminAuditLogDocument,
    "\n  query AdminMedications {\n    medicinalProducts {\n      id productName stockLevel stockThreshold isBelowThreshold\n      medication { id innName atcCode form strength }\n    }\n  }\n": types.AdminMedicationsDocument,
    "\n  query AdminOrders {\n    orders {\n      id wardUnitId status createdAt\n      lines { medicationId quantity medication { innName } }\n    }\n  }\n": types.AdminOrdersDocument,
    "\n  query AdminActors {\n    actors {\n      id\n      role\n      wardUnitId\n      wardUnit { name }\n    }\n  }\n": types.AdminActorsDocument,
    "\n  query AdminWardUnits {\n    wardUnits {\n      id\n      name\n    }\n  }\n": types.AdminWardUnitsDocument,
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
export function graphql(source: "\n  query AdminAuditLog {\n    auditLog {\n      actorId\n      action\n      entityId\n      occurredAt\n    }\n  }\n"): (typeof documents)["\n  query AdminAuditLog {\n    auditLog {\n      actorId\n      action\n      entityId\n      occurredAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminMedications {\n    medicinalProducts {\n      id productName stockLevel stockThreshold isBelowThreshold\n      medication { id innName atcCode form strength }\n    }\n  }\n"): (typeof documents)["\n  query AdminMedications {\n    medicinalProducts {\n      id productName stockLevel stockThreshold isBelowThreshold\n      medication { id innName atcCode form strength }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminOrders {\n    orders {\n      id wardUnitId status createdAt\n      lines { medicationId quantity medication { innName } }\n    }\n  }\n"): (typeof documents)["\n  query AdminOrders {\n    orders {\n      id wardUnitId status createdAt\n      lines { medicationId quantity medication { innName } }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminActors {\n    actors {\n      id\n      role\n      wardUnitId\n      wardUnit { name }\n    }\n  }\n"): (typeof documents)["\n  query AdminActors {\n    actors {\n      id\n      role\n      wardUnitId\n      wardUnit { name }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminWardUnits {\n    wardUnits {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query AdminWardUnits {\n    wardUnits {\n      id\n      name\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;