import type { BaseProduct } from "../../../besa-generated/types/aggregate-types";

// Domain functions for Product
// Add business logic here. These functions must not depend on infra/.

export function createProduct(id: string): BaseProduct {
  return { id };
}
