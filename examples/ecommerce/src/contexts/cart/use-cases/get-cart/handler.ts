import { execute } from "./execute";
import type { GetCartRepos } from "../../../../besa-generated/contracts/cart/get-cart";

// HTTP handler for cart/get-cart
// Replace 'null as never' with real repository implementations from src/infra/.
export async function handler(input: unknown): Promise<unknown> {
  const repos: GetCartRepos = {
    // TODO: replace with real implementation
    // import { ReadonlyPrismaCartRepository } from "../../../../infra/cart-prisma-repository";
    cart: null as never, // new ReadonlyPrismaCartRepository()
  };
  return execute(input, repos);
}
