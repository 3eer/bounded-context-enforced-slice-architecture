# BESA Example: E-commerce

This example shows a typical e-commerce application with 5 bounded contexts.

## Contexts

| Context | Aggregates | Reads from |
|---|---|---|
| `catalog` | `product` | — |
| `cart` | `cart` | `catalog` (via `ProductReadService`) |
| `order` | `order` | `cart` (via `CartReadService`) |
| `shipping` | `shipment` | `order` (via `OrderReadService`) |
| `identity` | `user` | — |

## Try it

```bash
# From the repo root, build the CLI
pnpm build

# Move into this example
cd examples/ecommerce

# Generate all files
node ../../dist/index.js generate

# Verify everything is in place
node ../../dist/index.js check

# Preview what a new use-case would generate (no files written)
node ../../dist/index.js generate --dry-run

# Add a new use-case interactively
node ../../dist/index.js add use-case identity/register-user \
  --context identity \
  --type mutation \
  --aggregates user
```

## What gets generated

After `besa generate`, the directory looks like this:

```
src/
├── besa-generated/          ← DO NOT EDIT
│   ├── types/
│   │   ├── aggregate-types.ts
│   │   └── context-scope.ts
│   ├── repositories/
│   │   ├── product-repository.ts
│   │   ├── cart-repository.ts
│   │   ├── order-repository.ts
│   │   ├── shipment-repository.ts
│   │   └── user-repository.ts
│   ├── cross-context/
│   │   ├── product-read-service-interface.ts
│   │   ├── cart-read-service-interface.ts
│   │   └── order-read-service-interface.ts
│   └── contracts/
│       ├── mutation.ts
│       ├── query.ts
│       ├── catalog/get-product.ts
│       ├── cart/add-product.ts
│       ├── cart/get-cart.ts
│       ├── order/checkout.ts
│       ├── order/get-purchase-history.ts
│       ├── shipping/create-shipment.ts
│       └── shipping/get-shipment-status.ts
│
├── contexts/                ← Your code (generated once, then yours)
│   ├── catalog/
│   │   ├── domain/product.ts
│   │   └── use-cases/get-product/{execute,handler,execute.test}.ts
│   ├── cart/
│   │   ├── domain/cart.ts
│   │   └── use-cases/{add-product,get-cart}/{execute,handler,execute.test}.ts
│   ├── order/ ...
│   ├── shipping/ ...
│   └── identity/ ...
│
└── infra/                   ← You write these (Prisma adapters, etc.)
```

## Next steps after generate

1. **Fill in domain logic** — open `src/contexts/{context}/domain/*.ts` and implement business rules
2. **Implement repositories** — create `src/infra/{aggregate}-prisma-repository.ts` implementing the generated interfaces
3. **Wire handlers** — replace `null as never` in `handler.ts` with real repository instances
4. **Add ESLint** — extend `.eslintrc-besa.json` to enforce context isolation in CI
