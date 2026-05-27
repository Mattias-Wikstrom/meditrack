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

export type PharmacistStockAlertSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type PharmacistStockAlertSubscription = { __typename?: 'Subscription', stockBelowThreshold: { __typename?: 'StockAlertEvent', medicinalProductId: string, productName: string, stockLevel: number, stockThreshold: number } };

export type PharmacistOrdersQueryVariables = Exact<{ [key: string]: never; }>;


export type PharmacistOrdersQuery = { __typename?: 'Query', sent: Array<{ __typename?: 'Order', id: string, wardUnitId: string, status: OrderStatus, createdAt: string, lines: Array<{ __typename?: 'OrderLine', medicationId: string, quantity: number, medication?: { __typename?: 'Medication', innName: string } | null }> }>, confirmed: Array<{ __typename?: 'Order', id: string, wardUnitId: string, status: OrderStatus, createdAt: string, lines: Array<{ __typename?: 'OrderLine', medicationId: string, quantity: number, medication?: { __typename?: 'Medication', innName: string } | null }> }>, delivered: Array<{ __typename?: 'Order', id: string, wardUnitId: string, status: OrderStatus, createdAt: string, lines: Array<{ __typename?: 'OrderLine', medicationId: string, quantity: number, medication?: { __typename?: 'Medication', innName: string } | null }> }> };

export type PharmacistOrderStatusChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type PharmacistOrderStatusChangedSubscription = { __typename?: 'Subscription', orderStatusChanged: { __typename?: 'OrderStatusChangedEvent', orderId: string, from: OrderStatus, to: OrderStatus } };

export type PharmacistInventoryQueryVariables = Exact<{ [key: string]: never; }>;


export type PharmacistInventoryQuery = { __typename?: 'Query', medicinalProducts: Array<{ __typename?: 'MedicinalProduct', id: string, productName: string, stockLevel: number, stockThreshold: number, isBelowThreshold: boolean, medication?: { __typename?: 'Medication', id: string, innName: string, atcCode: string, form: MedicationForm, strength: string } | null }> };

export type PharmacistInventoryProductUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type PharmacistInventoryProductUpdatedSubscription = { __typename?: 'Subscription', medicinalProductUpdated: { __typename?: 'MedicinalProduct', id: string, productName: string, stockLevel: number, stockThreshold: number, isBelowThreshold: boolean, medication?: { __typename?: 'Medication', id: string, innName: string, atcCode: string, form: MedicationForm, strength: string } | null } };

export type PharmacistProductDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type PharmacistProductDetailQuery = { __typename?: 'Query', medicinalProduct?: { __typename?: 'MedicinalProduct', id: string, productName: string, stockLevel: number, stockThreshold: number, isBelowThreshold: boolean, medication?: { __typename?: 'Medication', id: string, innName: string, atcCode: string, form: MedicationForm, strength: string } | null } | null };

export type PharmacistProductDetailUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type PharmacistProductDetailUpdatedSubscription = { __typename?: 'Subscription', medicinalProductUpdated: { __typename?: 'MedicinalProduct', id: string, productName: string, stockLevel: number, stockThreshold: number, isBelowThreshold: boolean, medication?: { __typename?: 'Medication', id: string, innName: string, atcCode: string, form: MedicationForm, strength: string } | null } };

export type PharmacistMedicationDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type PharmacistMedicationDetailQuery = { __typename?: 'Query', medication?: { __typename?: 'Medication', id: string, innName: string, atcCode: string, form: MedicationForm, strength: string } | null, medicinalProducts: Array<{ __typename?: 'MedicinalProduct', id: string, productName: string, stockLevel: number, stockThreshold: number, isBelowThreshold: boolean }> };

export type GetOrderQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetOrderQuery = { __typename?: 'Query', order?: { __typename?: 'Order', id: string, wardUnitId: string, status: OrderStatus, createdAt: string, lines: Array<{ __typename?: 'OrderLine', medicationId: string, quantity: number, medication?: { __typename?: 'Medication', id: string, innName: string } | null }> } | null };

export type GetProductsQueryVariables = Exact<{
  medicationId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type GetProductsQuery = { __typename?: 'Query', medicinalProducts: Array<{ __typename?: 'MedicinalProduct', id: string, productName: string, stockLevel: number, isBelowThreshold: boolean }> };


export const PharmacistStockAlertDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"PharmacistStockAlert"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stockBelowThreshold"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medicinalProductId"}},{"kind":"Field","name":{"kind":"Name","value":"productName"}},{"kind":"Field","name":{"kind":"Name","value":"stockLevel"}},{"kind":"Field","name":{"kind":"Name","value":"stockThreshold"}}]}}]}}]} as unknown as DocumentNode<PharmacistStockAlertSubscription, PharmacistStockAlertSubscriptionVariables>;
export const PharmacistOrdersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PharmacistOrders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"sent"},"name":{"kind":"Name","value":"orders"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"EnumValue","value":"Sent"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"wardUnitId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lines"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medicationId"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"medication"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"innName"}}]}}]}}]}},{"kind":"Field","alias":{"kind":"Name","value":"confirmed"},"name":{"kind":"Name","value":"orders"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"EnumValue","value":"Confirmed"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"wardUnitId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lines"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medicationId"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"medication"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"innName"}}]}}]}}]}},{"kind":"Field","alias":{"kind":"Name","value":"delivered"},"name":{"kind":"Name","value":"orders"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"EnumValue","value":"Delivered"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"wardUnitId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lines"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medicationId"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"medication"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"innName"}}]}}]}}]}}]}}]} as unknown as DocumentNode<PharmacistOrdersQuery, PharmacistOrdersQueryVariables>;
export const PharmacistOrderStatusChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"PharmacistOrderStatusChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"orderStatusChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"orderId"}},{"kind":"Field","name":{"kind":"Name","value":"from"}},{"kind":"Field","name":{"kind":"Name","value":"to"}}]}}]}}]} as unknown as DocumentNode<PharmacistOrderStatusChangedSubscription, PharmacistOrderStatusChangedSubscriptionVariables>;
export const PharmacistInventoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PharmacistInventory"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medicinalProducts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"productName"}},{"kind":"Field","name":{"kind":"Name","value":"stockLevel"}},{"kind":"Field","name":{"kind":"Name","value":"stockThreshold"}},{"kind":"Field","name":{"kind":"Name","value":"isBelowThreshold"}},{"kind":"Field","name":{"kind":"Name","value":"medication"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"innName"}},{"kind":"Field","name":{"kind":"Name","value":"atcCode"}},{"kind":"Field","name":{"kind":"Name","value":"form"}},{"kind":"Field","name":{"kind":"Name","value":"strength"}}]}}]}}]}}]} as unknown as DocumentNode<PharmacistInventoryQuery, PharmacistInventoryQueryVariables>;
export const PharmacistInventoryProductUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"PharmacistInventoryProductUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medicinalProductUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"productName"}},{"kind":"Field","name":{"kind":"Name","value":"stockLevel"}},{"kind":"Field","name":{"kind":"Name","value":"stockThreshold"}},{"kind":"Field","name":{"kind":"Name","value":"isBelowThreshold"}},{"kind":"Field","name":{"kind":"Name","value":"medication"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"innName"}},{"kind":"Field","name":{"kind":"Name","value":"atcCode"}},{"kind":"Field","name":{"kind":"Name","value":"form"}},{"kind":"Field","name":{"kind":"Name","value":"strength"}}]}}]}}]}}]} as unknown as DocumentNode<PharmacistInventoryProductUpdatedSubscription, PharmacistInventoryProductUpdatedSubscriptionVariables>;
export const PharmacistProductDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PharmacistProductDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medicinalProduct"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"productName"}},{"kind":"Field","name":{"kind":"Name","value":"stockLevel"}},{"kind":"Field","name":{"kind":"Name","value":"stockThreshold"}},{"kind":"Field","name":{"kind":"Name","value":"isBelowThreshold"}},{"kind":"Field","name":{"kind":"Name","value":"medication"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"innName"}},{"kind":"Field","name":{"kind":"Name","value":"atcCode"}},{"kind":"Field","name":{"kind":"Name","value":"form"}},{"kind":"Field","name":{"kind":"Name","value":"strength"}}]}}]}}]}}]} as unknown as DocumentNode<PharmacistProductDetailQuery, PharmacistProductDetailQueryVariables>;
export const PharmacistProductDetailUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"PharmacistProductDetailUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medicinalProductUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"productName"}},{"kind":"Field","name":{"kind":"Name","value":"stockLevel"}},{"kind":"Field","name":{"kind":"Name","value":"stockThreshold"}},{"kind":"Field","name":{"kind":"Name","value":"isBelowThreshold"}},{"kind":"Field","name":{"kind":"Name","value":"medication"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"innName"}},{"kind":"Field","name":{"kind":"Name","value":"atcCode"}},{"kind":"Field","name":{"kind":"Name","value":"form"}},{"kind":"Field","name":{"kind":"Name","value":"strength"}}]}}]}}]}}]} as unknown as DocumentNode<PharmacistProductDetailUpdatedSubscription, PharmacistProductDetailUpdatedSubscriptionVariables>;
export const PharmacistMedicationDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PharmacistMedicationDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medication"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"innName"}},{"kind":"Field","name":{"kind":"Name","value":"atcCode"}},{"kind":"Field","name":{"kind":"Name","value":"form"}},{"kind":"Field","name":{"kind":"Name","value":"strength"}}]}},{"kind":"Field","name":{"kind":"Name","value":"medicinalProducts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"medicationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"productName"}},{"kind":"Field","name":{"kind":"Name","value":"stockLevel"}},{"kind":"Field","name":{"kind":"Name","value":"stockThreshold"}},{"kind":"Field","name":{"kind":"Name","value":"isBelowThreshold"}}]}}]}}]} as unknown as DocumentNode<PharmacistMedicationDetailQuery, PharmacistMedicationDetailQueryVariables>;
export const GetOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"order"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"wardUnitId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lines"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medicationId"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"medication"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"innName"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetOrderQuery, GetOrderQueryVariables>;
export const GetProductsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProducts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"medicationId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medicinalProducts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"medicationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"medicationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"productName"}},{"kind":"Field","name":{"kind":"Name","value":"stockLevel"}},{"kind":"Field","name":{"kind":"Name","value":"isBelowThreshold"}}]}}]}}]} as unknown as DocumentNode<GetProductsQuery, GetProductsQueryVariables>;