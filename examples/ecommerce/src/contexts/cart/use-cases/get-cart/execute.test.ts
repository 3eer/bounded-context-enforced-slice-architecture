import { describe, it, expect } from "vitest";
import { execute } from "./execute";

describe("cart/get-cart", () => {
  it("should throw 'Not implemented' until logic is added", async () => {
    const repos = {} as Parameters<typeof execute>[1];
    await expect(execute({}, repos)).rejects.toThrow("Not implemented");
  });
});
