export const typeDefs = /* GraphQL */ `
  type Query {
    wardUnit(id: ID!): WardUnit
    medications(query: String): [Medication!]!
    medication(id: ID!): Medication
    medicinalProducts: [MedicinalProduct!]!
    medicinalProduct(id: ID!): MedicinalProduct
  }

  type Mutation {
    createOrder(wardUnitId: ID!, lines: [OrderLineInput!]!): OrderPayload!
    sendOrder(orderId: ID!): OrderPayload!
    confirmOrder(orderId: ID!): OrderPayload!
    deliverOrder(orderId: ID!, productSelections: [ProductSelectionInput!]!): OrderPayload!
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
    UnauthorizedRole
    OrderHasAtLeastOneLine
    OrderLineQuantitiesPositive
    OrderNotFound
    InvalidStatusTransition
    MedicinalProductNotFound
    ProductMedicationMismatch
    SelectionQuantityMismatch
    InsufficientStock
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
