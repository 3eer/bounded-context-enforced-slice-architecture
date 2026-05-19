import type { BaseShipment } from "../../../besa-generated/types/aggregate-types";

// Domain functions for Shipment
// Add business logic here. These functions must not depend on infra/.

export function createShipment(id: string): BaseShipment {
  return { id };
}
