import { execute } from "./execute";
import type { CreateShipmentRepos } from "../../../../besa-generated/contracts/shipping/create-shipment";

// HTTP handler for shipping/create-shipment
// Replace 'null as never' with real repository implementations from src/infra/.
export async function handler(input: unknown): Promise<unknown> {
  const repos: CreateShipmentRepos = {
    // TODO: replace with real implementation
    // import { PrismaShipmentRepository } from "../../../../infra/shipment-prisma-repository";
    shipment: null as never, // new PrismaShipmentRepository()
    orderReadService: null as never, // inject OrderReadService implementation
  };
  return execute(input, repos);
}
