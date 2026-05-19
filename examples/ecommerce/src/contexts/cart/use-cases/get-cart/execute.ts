import { defineQuery } from "../../../../besa-generated/contracts/query";
import type { GetCartRepos } from "../../../../besa-generated/contracts/cart/get-cart";

export const execute = defineQuery<unknown, unknown, GetCartRepos>(
  async (_input, {
    cart: _cart,
  }) => {
    // TODO: implement cart/get-cart
    throw new Error("Not implemented");
  },
);
