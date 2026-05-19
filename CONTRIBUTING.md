# Contributing to BESA

## Development Setup

```bash
git clone https://github.com/lil-o-pg/bounded-context-enforced-slice-architecture.git
cd besa
pnpm install
pnpm build
pnpm test --run
```

## Project Structure

```
src/
├── index.ts        — CLI entry point (commander)
├── config.ts       — besa.config.yml loader + Zod validation
├── generate.ts     — file generation logic
├── check.ts        — besa check command
├── add.ts          — besa add context / aggregate / use-case
├── init.ts         — besa init command
└── utils/
    ├── fs.ts       — file I/O helpers (writeFile, writeFileOnce, dryRun support)
    └── naming.ts   — case conversion (toPascalCase, toKebabCase, etc.)
```

## Running Commands Locally

```bash
# Build first, then run via node
pnpm build
node dist/index.js generate
node dist/index.js check
node dist/index.js generate --dry-run

# Or use tsx for faster iteration without building
pnpm dev generate
```

## Adding a New Command

1. Add the implementation function to `src/add.ts` or a new file under `src/`
2. Register the command in `src/index.ts` using `program.command(...)`
3. Add tests under `src/` (vitest)
4. Update `README.md` with usage
5. Add an entry to `CHANGELOG.md`

## Testing

```bash
pnpm test          # watch mode
pnpm test --run    # single run (used in CI)
```

Tests live next to the source files (`*.test.ts`). The scaffold files generated into `src/contexts/` are covered by the integration flow in the test suite.

## Commit Style

Use conventional commits:

```
feat: add besa add aggregate command
fix: validate aggregate root must be PascalCase
docs: update README with dry-run flag
chore: bump zod to 3.23
```

## Pull Request Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `pnpm test --run` passes
- [ ] `pnpm build && node dist/index.js generate` runs without error
- [ ] README and CHANGELOG updated if behavior changed
- [ ] New commands include error messages with `Tip:` hints

## Design Rules (do not break these)

- **No generated file imports user code.** `src/besa-generated/` must never import from `src/contexts/` or `src/infra/`.
- **Scaffold files are written once.** `writeFileOnce` must be used for all files under `src/contexts/`. Never use `writeFile` for scaffold.
- **All constraints must be type errors or lint errors.** Do not add runtime enforcement that cannot be caught statically.
- **Error messages must include a `Tip:` line** pointing to the corrective action.
