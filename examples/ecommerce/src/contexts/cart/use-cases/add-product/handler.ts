import { execute } from "./execute";
import type { AddProductRepos } from "../../../../besa-generated/contracts/cart/add-product";

// HTTP handler for cart/add-product
// Replace 'null as never' with real repository implementations from src/infra/.
export async function handler(input: unknown): Promise<unknown> {
  const repos: AddProductRepos = {
    // TODO: replace with real implementation
    // import { PrismaCartRepository } from "../../../../infra/cart-prisma-repository";
    cart: null as never, // new PrismaCartRepository()
    productReadService: null as never, // inject ProductReadService implementation
  };
  return execute(input, repos);
}
