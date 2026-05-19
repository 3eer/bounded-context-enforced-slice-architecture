import { defineQuery } from "../../../../besa-generated/contracts/query";
import type { GetShipmentStatusRepos } from "../../../../besa-generated/contracts/shipping/get-shipment-status";

export const execute = defineQuery<unknown, unknown, GetShipmentStatusRepos>(
  async (_input, {
    shipment: _shipment,
  }) => {
    // TODO: implement shipping/get-shipment-status
    throw new Error("Not implemented");
  },
);
