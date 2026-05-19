import { describe, it, expect } from "vitest";
import {
  toPascalCase,
  toCamelCase,
  toKebabCase,
  useCaseNameToCamelCase,
} from "./naming.js";

describe("toPascalCase", () => {
  it("converts lowercase word", () => {
    expect(toPascalCase("cart")).toBe("Cart");
  });

  it("converts kebab-case", () => {
    expect(toPascalCase("cart-item")).toBe("CartItem");
  });

  it("converts snake_case", () => {
    expect(toPascalCase("cart_item")).toBe("CartItem");
  });

  it("is idempotent on PascalCase", () => {
    expect(toPascalCase("CartItem")).toBe("CartItem");
  });

  it("converts multi-segment kebab", () => {
    expect(toPascalCase("add-product-to-cart")).toBe("AddProductToCart");
  });

  it("converts single uppercase letter", () => {
    expect(toPascalCase("A")).toBe("A");
  });
});

describe("toCamelCase", () => {
  it("converts PascalCase to camelCase", () => {
    expect(toCamelCase("Cart")).toBe("cart");
  });

  it("converts PascalCase with multiple words", () => {
    expect(toCamelCase("CartItem")).toBe("cartItem");
  });

  it("converts kebab-case to camelCase", () => {
    expect(toCamelCase("add-product")).toBe("addProduct");
  });

  it("converts snake_case to camelCase", () => {
    expect(toCamelCase("add_product")).toBe("addProduct");
  });

  it("leaves already-camelCase unchanged", () => {
    expect(toCamelCase("addProduct")).toBe("addProduct");
  });
});

describe("toKebabCase", () => {
  it("converts PascalCase to kebab-case", () => {
    expect(toKebabCase("CartItem")).toBe("cart-item");
  });

  it("leaves lowercase unchanged", () => {
    expect(toKebabCase("cart")).toBe("cart");
  });

  it("converts multi-word PascalCase", () => {
    expect(toKebabCase("ProductReadService")).toBe("product-read-service");
  });

  it("converts single PascalCase word", () => {
    expect(toKebabCase("Product")).toBe("product");
  });
});

describe("useCaseNameToCamelCase", () => {
  it("extracts last segment and converts to camelCase", () => {
    expect(useCaseNameToCamelCase("cart/add-product")).toBe("addProduct");
  });

  it("handles query use-case", () => {
    expect(useCaseNameToCamelCase("cart/get-cart")).toBe("getCart");
  });

  it("handles single-word use-case path", () => {
    expect(useCaseNameToCamelCase("order/checkout")).toBe("checkout");
  });

  it("handles use-case without context prefix", () => {
    expect(useCaseNameToCamelCase("add-product")).toBe("addProduct");
  });

  it("handles shipping use-cases", () => {
    expect(useCaseNameToCamelCase("shipping/create-shipment")).toBe(
      "createShipment"
    );
    expect(useCaseNameToCamelCase("shipping/get-shipment-status")).toBe(
      "getShipmentStatus"
    );
  });
});
