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
    "\n  subscription PharmacistStockAlert {\n    stockBelowThreshold {\n      medicinalProductId productName stockLevel stockThreshold\n    }\n  }\n": typeof types.PharmacistStockAlertDocument,
    "\n  query PharmacistOrders {\n    sent: orders(status: Sent) {\n      id wardUnitId status createdAt\n      lines { medicationId quantity medication { innName } }\n    }\n    confirmed: orders(status: Confirmed) {\n      id wardUnitId status createdAt\n      lines { medicationId quantity medication { innName } }\n    }\n    delivered: orders(status: Delivered) {\n      id wardUnitId status createdAt\n      lines { medicationId quantity medication { innName } }\n    }\n  }\n": typeof types.PharmacistOrdersDocument,
    "\n  subscription PharmacistOrderStatusChanged {\n    orderStatusChanged { orderId from to }\n  }\n": typeof types.PharmacistOrderStatusChangedDocument,
    "\n  query PharmacistInventory {\n    medicinalProducts {\n      id productName stockLevel stockThreshold isBelowThreshold\n      medication { id innName atcCode form strength }\n    }\n  }\n": typeof types.PharmacistInventoryDocument,
    "\n  subscription PharmacistProductRestocked {\n    productRestocked { medicinalProductId productName stockLevel }\n  }\n": typeof types.PharmacistProductRestockedDocument,
    "\n  mutation RestockProduct($medicinalProductId: ID!, $quantity: Int!) {\n    restockProduct(medicinalProductId: $medicinalProductId, quantity: $quantity) {\n      successful\n      product { id stockLevel isBelowThreshold }\n      errors\n    }\n  }\n": typeof types.RestockProductDocument,
    "\n  query PharmacistProductDetail($id: ID!) {\n    medicinalProduct(id: $id) {\n      id productName stockLevel stockThreshold isBelowThreshold\n      medication { id innName atcCode form strength }\n    }\n  }\n": typeof types.PharmacistProductDetailDocument,
    "\n  subscription PharmacistProductDetailRestocked {\n    productRestocked { medicinalProductId productName stockLevel }\n  }\n": typeof types.PharmacistProductDetailRestockedDocument,
    "\n  query PharmacistMedicationDetail($id: ID!) {\n    medication(id: $id) {\n      id innName atcCode form strength\n    }\n    medicinalProducts(medicationId: $id) {\n      id productName stockLevel stockThreshold isBelowThreshold\n    }\n  }\n": typeof types.PharmacistMedicationDetailDocument,
    "\n  query GetOrder($id: ID!) {\n    order(id: $id) {\n      id wardUnitId status createdAt\n      lines {\n        medicationId quantity\n        medication { id innName }\n      }\n    }\n  }\n": typeof types.GetOrderDocument,
    "\n  query GetProducts($medicationId: ID) {\n    medicinalProducts(medicationId: $medicationId) {\n      id productName stockLevel isBelowThreshold\n    }\n  }\n": typeof types.GetProductsDocument,
};
const documents: Documents = {
    "\n  subscription PharmacistStockAlert {\n    stockBelowThreshold {\n      medicinalProductId productName stockLevel stockThreshold\n    }\n  }\n": types.PharmacistStockAlertDocument,
    "\n  query PharmacistOrders {\n    sent: orders(status: Sent) {\n      id wardUnitId status createdAt\n      lines { medicationId quantity medication { innName } }\n    }\n    confirmed: orders(status: Confirmed) {\n      id wardUnitId status createdAt\n      lines { medicationId quantity medication { innName } }\n    }\n    delivered: orders(status: Delivered) {\n      id wardUnitId status createdAt\n      lines { medicationId quantity medication { innName } }\n    }\n  }\n": types.PharmacistOrdersDocument,
    "\n  subscription PharmacistOrderStatusChanged {\n    orderStatusChanged { orderId from to }\n  }\n": types.PharmacistOrderStatusChangedDocument,
    "\n  query PharmacistInventory {\n    medicinalProducts {\n      id productName stockLevel stockThreshold isBelowThreshold\n      medication { id innName atcCode form strength }\n    }\n  }\n": types.PharmacistInventoryDocument,
    "\n  subscription PharmacistProductRestocked {\n    productRestocked { medicinalProductId productName stockLevel }\n  }\n": types.PharmacistProductRestockedDocument,
    "\n  mutation RestockProduct($medicinalProductId: ID!, $quantity: Int!) {\n    restockProduct(medicinalProductId: $medicinalProductId, quantity: $quantity) {\n      successful\n      product { id stockLevel isBelowThreshold }\n      errors\n    }\n  }\n": types.RestockProductDocument,
    "\n  query PharmacistProductDetail($id: ID!) {\n    medicinalProduct(id: $id) {\n      id productName stockLevel stockThreshold isBelowThreshold\n      medication { id innName atcCode form strength }\n    }\n  }\n": types.PharmacistProductDetailDocument,
    "\n  subscription PharmacistProductDetailRestocked {\n    productRestocked { medicinalProductId productName stockLevel }\n  }\n": types.PharmacistProductDetailRestockedDocument,
    "\n  query PharmacistMedicationDetail($id: ID!) {\n    medication(id: $id) {\n      id innName atcCode form strength\n    }\n    medicinalProducts(medicationId: $id) {\n      id productName stockLevel stockThreshold isBelowThreshold\n    }\n  }\n": types.PharmacistMedicationDetailDocument,
    "\n  query GetOrder($id: ID!) {\n    order(id: $id) {\n      id wardUnitId status createdAt\n      lines {\n        medicationId quantity\n        medication { id innName }\n      }\n    }\n  }\n": types.GetOrderDocument,
    "\n  query GetProducts($medicationId: ID) {\n    medicinalProducts(medicationId: $medicationId) {\n      id productName stockLevel isBelowThreshold\n    }\n  }\n": types.GetProductsDocument,
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
export function graphql(source: "\n  subscription PharmacistStockAlert {\n    stockBelowThreshold {\n      medicinalProductId productName stockLevel stockThreshold\n    }\n  }\n"): (typeof documents)["\n  subscription PharmacistStockAlert {\n    stockBelowThreshold {\n      medicinalProductId productName stockLevel stockThreshold\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PharmacistOrders {\n    sent: orders(status: Sent) {\n      id wardUnitId status createdAt\n      lines { medicationId quantity medication { innName } }\n    }\n    confirmed: orders(status: Confirmed) {\n      id wardUnitId status createdAt\n      lines { medicationId quantity medication { innName } }\n    }\n    delivered: orders(status: Delivered) {\n      id wardUnitId status createdAt\n      lines { medicationId quantity medication { innName } }\n    }\n  }\n"): (typeof documents)["\n  query PharmacistOrders {\n    sent: orders(status: Sent) {\n      id wardUnitId status createdAt\n      lines { medicationId quantity medication { innName } }\n    }\n    confirmed: orders(status: Confirmed) {\n      id wardUnitId status createdAt\n      lines { medicationId quantity medication { innName } }\n    }\n    delivered: orders(status: Delivered) {\n      id wardUnitId status createdAt\n      lines { medicationId quantity medication { innName } }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription PharmacistOrderStatusChanged {\n    orderStatusChanged { orderId from to }\n  }\n"): (typeof documents)["\n  subscription PharmacistOrderStatusChanged {\n    orderStatusChanged { orderId from to }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PharmacistInventory {\n    medicinalProducts {\n      id productName stockLevel stockThreshold isBelowThreshold\n      medication { id innName atcCode form strength }\n    }\n  }\n"): (typeof documents)["\n  query PharmacistInventory {\n    medicinalProducts {\n      id productName stockLevel stockThreshold isBelowThreshold\n      medication { id innName atcCode form strength }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription PharmacistProductRestocked {\n    productRestocked { medicinalProductId productName stockLevel }\n  }\n"): (typeof documents)["\n  subscription PharmacistProductRestocked {\n    productRestocked { medicinalProductId productName stockLevel }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RestockProduct($medicinalProductId: ID!, $quantity: Int!) {\n    restockProduct(medicinalProductId: $medicinalProductId, quantity: $quantity) {\n      successful\n      product { id stockLevel isBelowThreshold }\n      errors\n    }\n  }\n"): (typeof documents)["\n  mutation RestockProduct($medicinalProductId: ID!, $quantity: Int!) {\n    restockProduct(medicinalProductId: $medicinalProductId, quantity: $quantity) {\n      successful\n      product { id stockLevel isBelowThreshold }\n      errors\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PharmacistProductDetail($id: ID!) {\n    medicinalProduct(id: $id) {\n      id productName stockLevel stockThreshold isBelowThreshold\n      medication { id innName atcCode form strength }\n    }\n  }\n"): (typeof documents)["\n  query PharmacistProductDetail($id: ID!) {\n    medicinalProduct(id: $id) {\n      id productName stockLevel stockThreshold isBelowThreshold\n      medication { id innName atcCode form strength }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription PharmacistProductDetailRestocked {\n    productRestocked { medicinalProductId productName stockLevel }\n  }\n"): (typeof documents)["\n  subscription PharmacistProductDetailRestocked {\n    productRestocked { medicinalProductId productName stockLevel }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PharmacistMedicationDetail($id: ID!) {\n    medication(id: $id) {\n      id innName atcCode form strength\n    }\n    medicinalProducts(medicationId: $id) {\n      id productName stockLevel stockThreshold isBelowThreshold\n    }\n  }\n"): (typeof documents)["\n  query PharmacistMedicationDetail($id: ID!) {\n    medication(id: $id) {\n      id innName atcCode form strength\n    }\n    medicinalProducts(medicationId: $id) {\n      id productName stockLevel stockThreshold isBelowThreshold\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetOrder($id: ID!) {\n    order(id: $id) {\n      id wardUnitId status createdAt\n      lines {\n        medicationId quantity\n        medication { id innName }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetOrder($id: ID!) {\n    order(id: $id) {\n      id wardUnitId status createdAt\n      lines {\n        medicationId quantity\n        medication { id innName }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetProducts($medicationId: ID) {\n    medicinalProducts(medicationId: $medicationId) {\n      id productName stockLevel isBelowThreshold\n    }\n  }\n"): (typeof documents)["\n  query GetProducts($medicationId: ID) {\n    medicinalProducts(medicationId: $medicationId) {\n      id productName stockLevel isBelowThreshold\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;