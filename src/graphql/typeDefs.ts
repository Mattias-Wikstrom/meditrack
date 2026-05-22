export const typeDefs = /* GraphQL */ `
  type Query {
    wardUnit(id: ID!): WardUnit
    medications(query: String): [Medication!]!
    medication(id: ID!): Medication
  }

  type Mutation {
    createOrder(wardUnitId: ID!, lines: [OrderLineInput!]!): OrderPayload!
    advanceOrderStatus(orderId: ID!): OrderPayload!
    deliverOrder(orderId: ID!): OrderPayload!
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
    name: String!
    atcCode: String!
    form: MedicationForm!
    strength: String!
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
    OrderHasAtLeastOneLine
    OrderLineQuantitiesPositive
    OrderNotFound
    InvalidStatusTransition
    MedicationNotFound
  }

  input OrderLineInput {
    medicationId: ID!
    quantity: Int!
  }
`;
