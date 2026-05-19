# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-05-19

### Added

- `besa init` — initialize `besa.config.yml` with a minimal template
- `besa generate` — generate all files from `besa.config.yml`
  - `src/besa-generated/types/aggregate-types.ts` — base entity interfaces
  - `src/besa-generated/types/context-scope.ts` — context-to-aggregate mapping types
  - `src/besa-generated/repositories/{aggregate}-repository.ts` — `Mutable` / `Readonly` repository interfaces
  - `src/besa-generated/contracts/mutation.ts` + `query.ts` — `defineMutation` / `defineQuery` helpers
  - `src/besa-generated/cross-context/{service}-interface.ts` — cross-context read service interfaces
  - `src/besa-generated/contracts/{context}/{use-case}.ts` — per-use-case repos type and execute type
  - `.eslintrc-besa.json` — `eslint-plugin-boundaries` rules enforcing context isolation
  - `src/contexts/{context}/domain/{aggregate}.ts` — domain scaffold (written once)
  - `src/contexts/{context}/use-cases/{use-case}/execute.ts` — use-case scaffold (written once)
  - `src/contexts/{context}/use-cases/{use-case}/handler.ts` — handler scaffold (written once)
  - `src/contexts/{context}/use-cases/{use-case}/execute.test.ts` — test scaffold (written once)
- `besa generate --dry-run` — preview what would be written without touching the filesystem
- `besa check` — verify generated files, scaffold files, and cross_context_reads consistency
- `besa add context <name>` — add a context to `besa.config.yml` and regenerate
- `besa add aggregate <name>` — add an aggregate to `besa.config.yml` and regenerate
- `besa add use-case <path>` — add a use-case to `besa.config.yml` and regenerate
- Improved error messages with actionable `Tip:` hints throughout CLI
