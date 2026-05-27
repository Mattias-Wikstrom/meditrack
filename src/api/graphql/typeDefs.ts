export const typeDefs = /* GraphQL */ `
  type Subscription {
    orderDraftCreated: OrderDraftCreatedEvent!
    orderDraftUpdated: OrderDraftUpdatedEvent!
    orderStatusChanged: OrderStatusChangedEvent!
    stockBelowThreshold: StockAlertEvent!
    productRestocked: ProductRestockedEvent!
  }

  type ProductRestockedEvent {
    medicinalProductId: ID!
    productName: String!
    stockLevel: Int!
  }

  type OrderDraftCreatedEvent {
    orderId: ID!
    wardUnitId: ID!
    actorId: String!
  }

  type OrderDraftUpdatedEvent {
    orderId: ID!
    actorId: String!
  }

  type OrderStatusChangedEvent {
    orderId: ID!
    from: OrderStatus!
    to: OrderStatus!
    actorId: String!
  }

  type StockAlertEvent {
    medicinalProductId: ID!
    productName: String!
    medicationId: ID!
    stockLevel: Int!
    stockThreshold: Int!
  }

  type Query {
    wardUnit(id: ID!): WardUnit
    wardUnits: [WardUnit!]!
    orders(status: OrderStatus): [Order!]!
    order(id: ID!): Order
    medications(query: String): [Medication!]!
    medication(id: ID!): Medication
    medicinalProducts(medicationId: ID): [MedicinalProduct!]!
    medicinalProduct(id: ID!): MedicinalProduct
    actors: [Actor!]!
    auditLog: [AuditEvent!]!
  }

  type WardUnit {
    id: ID!
    name: String!
    orders: [Order!]!
  }

  type Order {
    id: ID!
    wardUnitId: ID!
    wardUnit: WardUnit
    status: OrderStatus!
    createdAt: String!
    lines: [OrderLine!]!
  }

  type OrderLine {
    medicationId: ID!
    quantity: Int!
    medication: Medication
  }

  type Medication {
    id: ID!
    innName: String!
    atcCode: String!
    form: MedicationForm!
    strength: String!
  }

  type MedicinalProduct {
    id: ID!
    productName: String!
    medicationId: ID!
    medication: Medication
    stockLevel: Int!
    stockThreshold: Int!
    isBelowThreshold: Boolean!
  }

  type OrderPayload {
    successful: Boolean!
    order: Order
    errors: [ErrorCode!]!
  }

  type RestockPayload {
    successful: Boolean!
    product: MedicinalProduct
    errors: [ErrorCode!]!
  }

  enum OrderStatus {
    Draft
    Sent
    Confirmed
    Delivered
  }

  enum MedicationForm {
    Tablet
    Capsule
    Injection
    Solution
    Cream
    Drops
    Inhaler
  }

  enum ErrorCode {
    ActorNotFound
    UnauthorizedRole
    ActorNotAssignedToWardUnit
    OrderHasAtLeastOneLine
    OrderLineQuantitiesPositive
    OrderNotFound
    InvalidStatusTransition
    MedicinalProductNotFound
    ProductMedicationMismatch
    SelectionQuantityMismatch
    InsufficientStock
    InvalidQuantity
  }

  type Actor {
    id: ID!
    role: String!
    wardUnitId: ID
    wardUnit: WardUnit
  }

  type AuditEvent {
    actorId: String!
    action: String!
    entityId: String!
    occurredAt: String!
  }

  input OrderLineInput {
    medicationId: ID!
    quantity: Int!
  }

  input ProductSelectionInput {
    medicationId: ID!
    medicinalProductId: ID!
    quantity: Int!
  }
`;
