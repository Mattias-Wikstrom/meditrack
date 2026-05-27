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
  createActor: Actor;
  createMedication: Medication;
  createMedicinalProduct: MedicinalProduct;
  createOrder: OrderPayload;
  createWardUnit: WardUnit;
  deleteActor: Scalars['Boolean']['output'];
  deleteMedication: Scalars['Boolean']['output'];
  deleteMedicinalProduct: Scalars['Boolean']['output'];
  deleteWardUnit: Scalars['Boolean']['output'];
  deliverOrder: OrderPayload;
  restockProduct: RestockPayload;
  sendOrder: OrderPayload;
  updateActor: Actor;
  updateMedication: Medication;
  updateMedicinalProduct: MedicinalProduct;
  updateOrderLines: OrderPayload;
  updateWardUnit: WardUnit;
};


export type MutationConfirmOrderArgs = {
  orderId: Scalars['ID']['input'];
};


export type MutationCreateActorArgs = {
  id: Scalars['String']['input'];
  password: Scalars['String']['input'];
  role: Scalars['String']['input'];
  wardUnitId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationCreateMedicationArgs = {
  atcCode: Scalars['String']['input'];
  form: MedicationForm;
  innName: Scalars['String']['input'];
  strength: Scalars['String']['input'];
};


export type MutationCreateMedicinalProductArgs = {
  medicationId: Scalars['ID']['input'];
  productName: Scalars['String']['input'];
  stockLevel: Scalars['Int']['input'];
  stockThreshold: Scalars['Int']['input'];
};


export type MutationCreateOrderArgs = {
  lines: Array<OrderLineInput>;
};


export type MutationCreateWardUnitArgs = {
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};


export type MutationDeleteActorArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteMedicationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteMedicinalProductArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteWardUnitArgs = {
  id: Scalars['ID']['input'];
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


export type MutationUpdateActorArgs = {
  id: Scalars['ID']['input'];
  role?: InputMaybe<Scalars['String']['input']>;
  wardUnitId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationUpdateMedicationArgs = {
  atcCode?: InputMaybe<Scalars['String']['input']>;
  form?: InputMaybe<MedicationForm>;
  id: Scalars['ID']['input'];
  innName?: InputMaybe<Scalars['String']['input']>;
  strength?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateMedicinalProductArgs = {
  id: Scalars['ID']['input'];
  productName?: InputMaybe<Scalars['String']['input']>;
  stockThreshold?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationUpdateOrderLinesArgs = {
  lines: Array<OrderLineInput>;
  orderId: Scalars['ID']['input'];
};


export type MutationUpdateWardUnitArgs = {
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};

export type Order = {
  __typename?: 'Order';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lines: Array<OrderLine>;
  status: OrderStatus;
  wardUnit?: Maybe<WardUnit>;
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

export type ProductRestockedEvent = {
  __typename?: 'ProductRestockedEvent';
  medicinalProductId: Scalars['ID']['output'];
  productName: Scalars['String']['output'];
  stockLevel: Scalars['Int']['output'];
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

export type RepositoryChangeEvent = {
  __typename?: 'RepositoryChangeEvent';
  entityId: Scalars['String']['output'];
  entityType: Scalars['String']['output'];
  kind: Scalars['String']['output'];
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
  medicinalProductUpdated: MedicinalProduct;
  orderDraftCreated: OrderDraftCreatedEvent;
  orderDraftUpdated: OrderDraftUpdatedEvent;
  orderStatusChanged: OrderStatusChangedEvent;
  productRestocked: ProductRestockedEvent;
  repositoryChanged: RepositoryChangeEvent;
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

export type AdminInventoryProductUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type AdminInventoryProductUpdatedSubscription = { __typename?: 'Subscription', medicinalProductUpdated: { __typename?: 'MedicinalProduct', id: string, productName: string, stockLevel: number, stockThreshold: number, isBelowThreshold: boolean } };

export type AdminMedicationDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AdminMedicationDetailQuery = { __typename?: 'Query', medication?: { __typename?: 'Medication', id: string, innName: string, atcCode: string, form: MedicationForm, strength: string } | null, medicinalProducts: Array<{ __typename?: 'MedicinalProduct', id: string, productName: string, stockLevel: number, stockThreshold: number, isBelowThreshold: boolean }> };

export type AdminMedicationDetailProductUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type AdminMedicationDetailProductUpdatedSubscription = { __typename?: 'Subscription', medicinalProductUpdated: { __typename?: 'MedicinalProduct', id: string, productName: string, stockLevel: number, stockThreshold: number, isBelowThreshold: boolean } };

export type AdminOrdersQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminOrdersQuery = { __typename?: 'Query', orders: Array<{ __typename?: 'Order', id: string, wardUnitId: string, status: OrderStatus, createdAt: string, wardUnit?: { __typename?: 'WardUnit', name: string } | null, lines: Array<{ __typename?: 'OrderLine', medicationId: string, quantity: number, medication?: { __typename?: 'Medication', innName: string } | null }> }> };

export type AdminActorsQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminActorsQuery = { __typename?: 'Query', actors: Array<{ __typename?: 'Actor', id: string, role: string, wardUnitId?: string | null, wardUnit?: { __typename?: 'WardUnit', name: string } | null }>, wardUnits: Array<{ __typename?: 'WardUnit', id: string, name: string }> };

export type AdminWardUnitsQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminWardUnitsQuery = { __typename?: 'Query', wardUnits: Array<{ __typename?: 'WardUnit', id: string, name: string }> };


export const AdminAuditLogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminAuditLog"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"auditLog"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"actorId"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"entityId"}},{"kind":"Field","name":{"kind":"Name","value":"occurredAt"}}]}}]}}]} as unknown as DocumentNode<AdminAuditLogQuery, AdminAuditLogQueryVariables>;
export const AdminMedicationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminMedications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medicinalProducts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"productName"}},{"kind":"Field","name":{"kind":"Name","value":"stockLevel"}},{"kind":"Field","name":{"kind":"Name","value":"stockThreshold"}},{"kind":"Field","name":{"kind":"Name","value":"isBelowThreshold"}},{"kind":"Field","name":{"kind":"Name","value":"medication"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"innName"}},{"kind":"Field","name":{"kind":"Name","value":"atcCode"}},{"kind":"Field","name":{"kind":"Name","value":"form"}},{"kind":"Field","name":{"kind":"Name","value":"strength"}}]}}]}}]}}]} as unknown as DocumentNode<AdminMedicationsQuery, AdminMedicationsQueryVariables>;
export const AdminInventoryProductUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"AdminInventoryProductUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medicinalProductUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"productName"}},{"kind":"Field","name":{"kind":"Name","value":"stockLevel"}},{"kind":"Field","name":{"kind":"Name","value":"stockThreshold"}},{"kind":"Field","name":{"kind":"Name","value":"isBelowThreshold"}}]}}]}}]} as unknown as DocumentNode<AdminInventoryProductUpdatedSubscription, AdminInventoryProductUpdatedSubscriptionVariables>;
export const AdminMedicationDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminMedicationDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medication"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"innName"}},{"kind":"Field","name":{"kind":"Name","value":"atcCode"}},{"kind":"Field","name":{"kind":"Name","value":"form"}},{"kind":"Field","name":{"kind":"Name","value":"strength"}}]}},{"kind":"Field","name":{"kind":"Name","value":"medicinalProducts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"medicationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"productName"}},{"kind":"Field","name":{"kind":"Name","value":"stockLevel"}},{"kind":"Field","name":{"kind":"Name","value":"stockThreshold"}},{"kind":"Field","name":{"kind":"Name","value":"isBelowThreshold"}}]}}]}}]} as unknown as DocumentNode<AdminMedicationDetailQuery, AdminMedicationDetailQueryVariables>;
export const AdminMedicationDetailProductUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"AdminMedicationDetailProductUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medicinalProductUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"productName"}},{"kind":"Field","name":{"kind":"Name","value":"stockLevel"}},{"kind":"Field","name":{"kind":"Name","value":"stockThreshold"}},{"kind":"Field","name":{"kind":"Name","value":"isBelowThreshold"}}]}}]}}]} as unknown as DocumentNode<AdminMedicationDetailProductUpdatedSubscription, AdminMedicationDetailProductUpdatedSubscriptionVariables>;
export const AdminOrdersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminOrders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"orders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"wardUnitId"}},{"kind":"Field","name":{"kind":"Name","value":"wardUnit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lines"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medicationId"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"medication"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"innName"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AdminOrdersQuery, AdminOrdersQueryVariables>;
export const AdminActorsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminActors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"actors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"wardUnitId"}},{"kind":"Field","name":{"kind":"Name","value":"wardUnit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"wardUnits"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AdminActorsQuery, AdminActorsQueryVariables>;
export const AdminWardUnitsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminWardUnits"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wardUnits"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AdminWardUnitsQuery, AdminWardUnitsQueryVariables>;