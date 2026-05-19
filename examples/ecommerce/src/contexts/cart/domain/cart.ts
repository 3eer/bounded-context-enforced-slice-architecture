import type { BaseCart } from "../../../besa-generated/types/aggregate-types";

// Domain functions for Cart
// Add business logic here. These functions must not depend on infra/.

export function createCart(id: string): BaseCart {
  return { id };
}
