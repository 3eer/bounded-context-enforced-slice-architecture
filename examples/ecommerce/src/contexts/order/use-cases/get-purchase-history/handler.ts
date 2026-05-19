import { execute } from "./execute";
import type { GetPurchaseHistoryRepos } from "../../../../besa-generated/contracts/order/get-purchase-history";

// HTTP handler for order/get-purchase-history
// Replace 'null as never' with real repository implementations from src/infra/.
export async function handler(input: unknown): Promise<unknown> {
  const repos: GetPurchaseHistoryRepos = {
    // TODO: replace with real implementation
    // import { ReadonlyPrismaOrderRepository } from "../../../../infra/order-prisma-repository";
    order: null as never, // new ReadonlyPrismaOrderRepository()
  };
  return execute(input, repos);
}
