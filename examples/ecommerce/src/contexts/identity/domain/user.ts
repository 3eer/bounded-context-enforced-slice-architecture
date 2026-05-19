import type { BaseUser } from "../../../besa-generated/types/aggregate-types";

// Domain functions for User
// Add business logic here. These functions must not depend on infra/.

export function createUser(id: string): BaseUser {
  return { id };
}
