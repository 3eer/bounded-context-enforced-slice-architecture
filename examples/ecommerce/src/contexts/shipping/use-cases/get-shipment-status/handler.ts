import { execute } from "./execute";
import type { GetShipmentStatusRepos } from "../../../../besa-generated/contracts/shipping/get-shipment-status";

// HTTP handler for shipping/get-shipment-status
// Replace 'null as never' with real repository implementations from src/infra/.
export async function handler(input: unknown): Promise<unknown> {
  const repos: GetShipmentStatusRepos = {
    // TODO: replace with real implementation
    // import { ReadonlyPrismaShipmentRepository } from "../../../../infra/shipment-prisma-repository";
    shipment: null as never, // new ReadonlyPrismaShipmentRepository()
  };
  return execute(input, repos);
}
