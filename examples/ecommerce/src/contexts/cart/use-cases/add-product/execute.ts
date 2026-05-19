import { defineMutation } from "../../../../besa-generated/contracts/mutation";
import type { AddProductRepos } from "../../../../besa-generated/contracts/cart/add-product";

export const execute = defineMutation<unknown, unknown, AddProductRepos>(
  async (_input, {
    cart: _cart,
    productReadService: _productReadService,
  }) => {
    // TODO: implement cart/add-product
    throw new Error("Not implemented");
  },
);
