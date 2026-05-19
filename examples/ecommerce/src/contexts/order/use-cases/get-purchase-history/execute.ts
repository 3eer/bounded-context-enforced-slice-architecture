import { defineQuery } from "../../../../besa-generated/contracts/query";
import type { GetPurchaseHistoryRepos } from "../../../../besa-generated/contracts/order/get-purchase-history";

export const execute = defineQuery<unknown, unknown, GetPurchaseHistoryRepos>(
  async (_input, {
    order: _order,
  }) => {
    // TODO: implement order/get-purchase-history
    throw new Error("Not implemented");
  },
);
