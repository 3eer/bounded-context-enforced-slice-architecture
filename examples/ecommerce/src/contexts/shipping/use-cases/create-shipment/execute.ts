import { defineMutation } from "../../../../besa-generated/contracts/mutation";
import type { CreateShipmentRepos } from "../../../../besa-generated/contracts/shipping/create-shipment";

export const execute = defineMutation<unknown, unknown, CreateShipmentRepos>(
  async (_input, {
    shipment: _shipment,
    orderReadService: _orderReadService,
  }) => {
    // TODO: implement shipping/create-shipment
    throw new Error("Not implemented");
  },
);
