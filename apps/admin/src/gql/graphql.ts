/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Actor = {
  __typename?: 'Actor';
  id: Scalars['ID']['output'];
  role: Scalars['String']['output'];
  wardUnit?: Maybe<WardUnit>;
  wardUnitId?: Maybe<Scalars['ID']['output']>;
};

export type AuditEvent = {
  __typename?: 'AuditEvent';
  action: Scalars['String']['output'];
  actorId: Scalars['String']['output'];
  entityId: Scalars['String']['output'];
  occurredAt: Scalars['String']['output'];
};

export enum ErrorCode {
  ActorNotAssignedToWardUnit = 'ActorNotAssignedToWardUnit',
  ActorNotFound = 'ActorNotFound',
  InsufficientStock = 'InsufficientStock',
  InvalidQuantity = 'InvalidQuantity',
  InvalidStatusTransition = 'InvalidStatusTransition',
  MedicinalProductNotFound = 'MedicinalProductNotFound',
  OrderHasAtLeastOneLine = 'OrderHasAtLeastOneLine',
  OrderLineQuantitiesPositive = 'OrderLineQuantitiesPositive',
  OrderNotFound = 'OrderNotFound',
  ProductMedicationMismatch = 'ProductMedicationMismatch',
  SelectionQuantityMismatch = 'SelectionQuantityMismatch',
  UnauthorizedRole = 'UnauthorizedRole'
}

export type Medication = {
  __typename?: 'Medication';
  atcCode: Scalars['String']['output'];
  form: MedicationForm;
  id: Scalars['ID']['output'];
  innName: Scalars['String']['output'];
  strength: Scalars['String']['output'];
};

export enum MedicationForm {
  Capsule = 'Capsule',
  Cream = 'Cream',
  Drops = 'Drops',
  Inhaler = 'Inhaler',
  Injection = 'Injection',
  Solution = 'Solution',
  Tablet = 'Tablet'
}

export type MedicinalProduct = {
  __typename?: 'MedicinalProduct';
  id: Scalars['ID']['output'];
  isBelowThreshold: Scalars['Boolean']['output'];
  medication?: Maybe<Medication>;
  medicationId: Scalars['ID']['output'];
  productName: Scalars['String']['output'];
  stockLevel: Scalars['Int']['output'];
  stockThreshold: Scalars['Int']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  confirmOrder: OrderPayload;
  createOrder: OrderPayload;
  deliverOrder: OrderPayload;
  restockProduct: RestockPayload;
  sendOrder: OrderPayload;
  updateOrderLines: OrderPayload;
};


export type MutationConfirmOrderArgs = {
  orderId: Scalars['ID']['input'];
};


export type MutationCreateOrderArgs = {
  lines: Array<OrderLineInput>;
};


export type MutationDeliverOrderArgs = {
  orderId: Scalars['ID']['input'];
  productSelections: Array<ProductSelectionInput>;
};


export type MutationRestockProductArgs = {
  medicinalProductId: Scalars['ID']['input'];
  quantity: Scalars['Int']['input'];
};


export type MutationSendOrderArgs = {
  orderId: Scalars['ID']['input'];
};


export type MutationUpdateOrderLinesArgs = {
  lines: Array<OrderLineInput>;
  orderId: Scalars['ID']['input'];
};

export type Order = {
  __typename?: 'Order';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lines: Array<OrderLine>;
  status: OrderStatus;
  wardUnitId: Scalars['ID']['output'];
};

export type OrderDraftCreatedEvent = {
  __typename?: 'OrderDraftCreatedEvent';
  actorId: Scalars['String']['output'];
  orderId: Scalars['ID']['output'];
  wardUnitId: Scalars['ID']['output'];
};

export type OrderDraftUpdatedEvent = {
  __typename?: 'OrderDraftUpdatedEvent';
  actorId: Scalars['String']['output'];
  orderId: Scalars['ID']['output'];
};

export type OrderLine = {
  __typename?: 'OrderLine';
  medication?: Maybe<Medication>;
  medicationId: Scalars['ID']['output'];
  quantity: Scalars['Int']['output'];
};

export type OrderLineInput = {
  medicationId: Scalars['ID']['input'];
  quantity: Scalars['Int']['input'];
};

export type OrderPayload = {
  __typename?: 'OrderPayload';
  errors: Array<ErrorCode>;
  order?: Maybe<Order>;
  successful: Scalars['Boolean']['output'];
};

export enum OrderStatus {
  Confirmed = 'Confirmed',
  Delivered = 'Delivered',
  Draft = 'Draft',
  Sent = 'Sent'
}

export type OrderStatusChangedEvent = {
  __typename?: 'OrderStatusChangedEvent';
  actorId: Scalars['String']['output'];
  from: OrderStatus;
  orderId: Scalars['ID']['output'];
  to: OrderStatus;
};

export type ProductSelectionInput = {
  medicationId: Scalars['ID']['input'];
  medicinalProductId: Scalars['ID']['input'];
  quantity: Scalars['Int']['input'];
};

export type Query = {
  __typename?: 'Query';
  actors: Array<Actor>;
  auditLog: Array<AuditEvent>;
  medication?: Maybe<Medication>;
  medications: Array<Medication>;
  medicinalProduct?: Maybe<MedicinalProduct>;
  medicinalProducts: Array<MedicinalProduct>;
  order?: Maybe<Order>;
  orders: Array<Order>;
  wardUnit?: Maybe<WardUnit>;
  wardUnits: Array<WardUnit>;
};


export type QueryMedicationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryMedicationsArgs = {
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryMedicinalProductArgs = {
  id: Scalars['ID']['input'];
};


export type QueryMedicinalProductsArgs = {
  medicationId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryOrderArgs = {
  id: Scalars['ID']['input'];
};


export type QueryOrdersArgs = {
  status?: InputMaybe<OrderStatus>;
};


export type QueryWardUnitArgs = {
  id: Scalars['ID']['input'];
};

export type RestockPayload = {
  __typename?: 'RestockPayload';
  errors: Array<ErrorCode>;
  product?: Maybe<MedicinalProduct>;
  successful: Scalars['Boolean']['output'];
};

export type StockAlertEvent = {
  __typename?: 'StockAlertEvent';
  medicationId: Scalars['ID']['output'];
  medicinalProductId: Scalars['ID']['output'];
  productName: Scalars['String']['output'];
  stockLevel: Scalars['Int']['output'];
  stockThreshold: Scalars['Int']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  orderDraftCreated: OrderDraftCreatedEvent;
  orderDraftUpdated: OrderDraftUpdatedEvent;
  orderStatusChanged: OrderStatusChangedEvent;
  stockBelowThreshold: StockAlertEvent;
};

export type WardUnit = {
  __typename?: 'WardUnit';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  orders: Array<Order>;
};

export type AdminAuditLogQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminAuditLogQuery = { __typename?: 'Query', auditLog: Array<{ __typename?: 'AuditEvent', actorId: string, action: string, entityId: string, occurredAt: string }> };

export type AdminMedicationsQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminMedicationsQuery = { __typename?: 'Query', medicinalProducts: Array<{ __typename?: 'MedicinalProduct', id: string, productName: string, stockLevel: number, stockThreshold: number, isBelowThreshold: boolean, medication?: { __typename?: 'Medication', id: string, innName: string, atcCode: string, form: MedicationForm, strength: string } | null }> };

export type AdminOrdersQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminOrdersQuery = { __typename?: 'Query', orders: Array<{ __typename?: 'Order', id: string, wardUnitId: string, status: OrderStatus, createdAt: string, lines: Array<{ __typename?: 'OrderLine', medicationId: string, quantity: number, medication?: { __typename?: 'Medication', innName: string } | null }> }> };

export type AdminActorsQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminActorsQuery = { __typename?: 'Query', actors: Array<{ __typename?: 'Actor', id: string, role: string, wardUnit?: { __typename?: 'WardUnit', name: string } | null }> };

export type AdminWardUnitsQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminWardUnitsQuery = { __typename?: 'Query', wardUnits: Array<{ __typename?: 'WardUnit', id: string, name: string }> };


export const AdminAuditLogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminAuditLog"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"auditLog"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"actorId"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"entityId"}},{"kind":"Field","name":{"kind":"Name","value":"occurredAt"}}]}}]}}]} as unknown as DocumentNode<AdminAuditLogQuery, AdminAuditLogQueryVariables>;
export const AdminMedicationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminMedications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medicinalProducts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"productName"}},{"kind":"Field","name":{"kind":"Name","value":"stockLevel"}},{"kind":"Field","name":{"kind":"Name","value":"stockThreshold"}},{"kind":"Field","name":{"kind":"Name","value":"isBelowThreshold"}},{"kind":"Field","name":{"kind":"Name","value":"medication"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"innName"}},{"kind":"Field","name":{"kind":"Name","value":"atcCode"}},{"kind":"Field","name":{"kind":"Name","value":"form"}},{"kind":"Field","name":{"kind":"Name","value":"strength"}}]}}]}}]}}]} as unknown as DocumentNode<AdminMedicationsQuery, AdminMedicationsQueryVariables>;
export const AdminOrdersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminOrders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"orders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"wardUnitId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lines"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medicationId"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"medication"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"innName"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AdminOrdersQuery, AdminOrdersQueryVariables>;
export const AdminActorsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminActors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"actors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"wardUnit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<AdminActorsQuery, AdminActorsQueryVariables>;
export const AdminWardUnitsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminWardUnits"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wardUnits"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AdminWardUnitsQuery, AdminWardUnitsQueryVariables>;