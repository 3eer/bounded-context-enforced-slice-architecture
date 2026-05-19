// "cart" → "Cart", "cart-item" → "CartItem", "cart_item" → "CartItem", "CartItem" → "CartItem"
export function toPascalCase(name: string): string {
  return name
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

// "Cart" → "cart", "CartItem" → "cartItem"
export function toCamelCase(name: string): string {
  const p = toPascalCase(name);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

// "CartItem" → "cart-item", "cart" → "cart"
export function toKebabCase(name: string): string {
  return name
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");
}

// "cart/add-product" → "addProduct"  (last segment after /, kebab→camelCase)
export function useCaseNameToCamelCase(useCasePath: string): string {
  const parts = useCasePath.split("/");
  const last = parts[parts.length - 1] ?? useCasePath;
  return toCamelCase(last);
}
