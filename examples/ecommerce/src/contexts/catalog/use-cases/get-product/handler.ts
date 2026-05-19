import { execute } from "./execute";
import type { GetProductRepos } from "../../../../besa-generated/contracts/catalog/get-product";

// HTTP handler for catalog/get-product
// Replace 'null as never' with real repository implementations from src/infra/.
export async function handler(input: unknown): Promise<unknown> {
  const repos: GetProductRepos = {
    // TODO: replace with real implementation
    // import { ReadonlyPrismaProductRepository } from "../../../../infra/product-prisma-repository";
    product: null as never, // new ReadonlyPrismaProductRepository()
  };
  return execute(input, repos);
}
