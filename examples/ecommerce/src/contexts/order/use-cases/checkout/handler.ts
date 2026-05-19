import { execute } from "./execute";
import type { CheckoutRepos } from "../../../../besa-generated/contracts/order/checkout";

// HTTP handler for order/checkout
// Replace 'null as never' with real repository implementations from src/infra/.
export async function handler(input: unknown): Promise<unknown> {
  const repos: CheckoutRepos = {
    // TODO: replace with real implementation
    // import { PrismaOrderRepository } from "../../../../infra/order-prisma-repository";
    order: null as never, // new PrismaOrderRepository()
    cartReadService: null as never, // inject CartReadService implementation
  };
  return execute(input, repos);
}
