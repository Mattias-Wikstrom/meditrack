export const typeDefs = /* GraphQL */ `
  type Subscription {
    orderStatusChanged: OrderStatusChangedEvent!
    stockBelowThreshold: StockAlertEvent!
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
    orders(status: OrderStatus): [Order!]!
    order(id: ID!): Order
    medications(query: String): [Medication!]!
    medication(id: ID!): Medication
    medicinalProducts(medicationId: ID): [MedicinalProduct!]!
    medicinalProduct(id: ID!): MedicinalProduct
  }

  type Mutation {
    createOrder(wardUnitId: ID!, lines: [OrderLineInput!]!): OrderPayload!
    sendOrder(orderId: ID!): OrderPayload!
    confirmOrder(orderId: ID!): OrderPayload!
    deliverOrder(orderId: ID!, productSelections: [ProductSelectionInput!]!): OrderPayload!
    restockProduct(medicinalProductId: ID!, quantity: Int!): RestockPayload!
  }

  type WardUnit {
    id: ID!
    name: String!
    orders: [Order!]!
  }

  type Order {
    id: ID!
    wardUnitId: ID!
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
