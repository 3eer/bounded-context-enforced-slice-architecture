import type { BaseOrder } from "../../../besa-generated/types/aggregate-types";

// Domain functions for Order
// Add business logic here. These functions must not depend on infra/.

export function createOrder(id: string): BaseOrder {
  return { id };
}
