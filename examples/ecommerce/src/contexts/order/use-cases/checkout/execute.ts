import { defineMutation } from "../../../../besa-generated/contracts/mutation";
import type { CheckoutRepos } from "../../../../besa-generated/contracts/order/checkout";

export const execute = defineMutation<unknown, unknown, CheckoutRepos>(
  async (_input, {
    order: _order,
    cartReadService: _cartReadService,
  }) => {
    // TODO: implement order/checkout
    throw new Error("Not implemented");
  },
);
