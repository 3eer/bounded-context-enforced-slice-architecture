import { defineQuery } from "../../../../besa-generated/contracts/query";
import type { GetProductRepos } from "../../../../besa-generated/contracts/catalog/get-product";

export const execute = defineQuery<unknown, unknown, GetProductRepos>(
  async (_input, {
    product: _product,
  }) => {
    // TODO: implement catalog/get-product
    throw new Error("Not implemented");
  },
);
