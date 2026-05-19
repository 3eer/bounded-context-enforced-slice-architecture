#!/usr/bin/env node

import { Command } from "commander";
import pc from "picocolors";
import { loadConfig } from "./config.js";
import { runGenerate } from "./generate.js";
import { runCheck } from "./check.js";
import { runAddUseCase, runAddContext, runAddAggregate } from "./add.js";
import { runInit } from "./init.js";

const program = new Command();

program
  .name("besa")
  .description("BESA CLI – Bounded-context Enforced Slice Architecture")
  .version("0.1.0");

// ---------------------------------------------------------------------------
// besa init
// ---------------------------------------------------------------------------
program
  .command("init")
  .description("Initialize besa.config.yml in the current directory")
  .action(async () => {
    try {
      const cwd = process.cwd();
      console.log(pc.cyan("besa init") + " – running...");
      await runInit(cwd);
      console.log(pc.green("\nDone."));
    } catch (err) {
      console.error(pc.red("Error:"), err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// besa generate [--dry-run]
// ---------------------------------------------------------------------------
program
  .command("generate")
  .description("Generate / update files from besa.config.yml")
  .option("--dry-run", "Preview what would be written without writing any files")
  .action(async (opts: { dryRun?: boolean }) => {
    try {
      const cwd = process.cwd();
      const config = await loadConfig(cwd);
      if (opts.dryRun) {
        console.log(pc.cyan("besa generate --dry-run") + " – previewing changes...\n");
      } else {
        console.log(pc.cyan("besa generate") + " – running...");
      }
      await runGenerate(cwd, config, { dryRun: opts.dryRun ?? false });
      if (opts.dryRun) {
        console.log(pc.yellow("\nDry run complete. No files were written."));
      } else {
        console.log(pc.green("\nDone."));
      }
    } catch (err) {
      console.error(pc.red("Error:"), err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// besa check
// ---------------------------------------------------------------------------
program
  .command("check")
  .description("Check that implementation matches besa.config.yml")
  .action(async () => {
    try {
      const cwd = process.cwd();
      const config = await loadConfig(cwd);
      console.log(pc.cyan("besa check") + " – running...\n");
      const passed = await runCheck(cwd, config);
      if (!passed) {
        console.log(pc.red("\nCheck failed. Fix the issues above and re-run."));
        process.exit(1);
      } else {
        console.log(pc.green("\nAll checks passed."));
      }
    } catch (err) {
      console.error(pc.red("Error:"), err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// besa add
// ---------------------------------------------------------------------------
const addCmd = program
  .command("add")
  .description("Add declarations to besa.config.yml and generate files");

// besa add context <name>
addCmd
  .command("context <name>")
  .description("Add a new context declaration")
  .option("--aggregates <aggregates>", "Comma-separated initial aggregate names")
  .action(async (name: string, opts: { aggregates?: string }) => {
    try {
      const aggregates = opts.aggregates
        ? opts.aggregates.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;
      console.log(pc.cyan("besa add context") + ` ${name} – running...`);
      await runAddContext(process.cwd(), name, { aggregates });
      console.log(pc.green("\nDone."));
    } catch (err) {
      console.error(pc.red("Error:"), err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// besa add aggregate <name>
addCmd
  .command("aggregate <name>")
  .description("Add a new aggregate declaration")
  .requiredOption("--context <context>", "Context this aggregate belongs to")
  .requiredOption("--root <root>", "PascalCase root entity name (e.g. Cart)")
  .option("--entities <entities>", "Comma-separated internal entity names")
  .action(async (name: string, opts: { context: string; root: string; entities?: string }) => {
    try {
      const entities = opts.entities
        ? opts.entities.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;
      console.log(pc.cyan("besa add aggregate") + ` ${name} – running...`);
      await runAddAggregate(process.cwd(), name, {
        context: opts.context,
        root: opts.root,
        entities,
      });
      console.log(pc.green("\nDone."));
    } catch (err) {
      console.error(pc.red("Error:"), err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// besa add use-case <path>
addCmd
  .command("use-case <path>")
  .description("Add a new use-case declaration and generate its files")
  .requiredOption("--context <context>", "Context this use-case belongs to")
  .requiredOption("--type <type>", "mutation or query")
  .requiredOption("--aggregates <aggregates>", "Comma-separated aggregate names")
  .option("--cross-context-reads <reads>", "Comma-separated context names to read from")
  .action(async (
    ucPath: string,
    opts: { context: string; type: string; aggregates: string; crossContextReads?: string }
  ) => {
    try {
      if (opts.type !== "mutation" && opts.type !== "query") {
        console.error(pc.red('Error: --type must be "mutation" or "query"'));
        process.exit(1);
      }
      const aggregates = opts.aggregates.split(",").map((s) => s.trim()).filter(Boolean);
      if (aggregates.length === 0) {
        console.error(pc.red("Error: --aggregates must list at least one aggregate"));
        process.exit(1);
      }
      const crossContextReads = opts.crossContextReads
        ? opts.crossContextReads.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;

      console.log(pc.cyan("besa add use-case") + ` ${ucPath} – running...`);
      await runAddUseCase(process.cwd(), ucPath, {
        context: opts.context,
        type: opts.type as "mutation" | "query",
        aggregates,
        crossContextReads,
      });
      console.log(pc.green("\nDone."));
    } catch (err) {
      console.error(pc.red("Error:"), err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program.parse(process.argv);
