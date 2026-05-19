import path from "node:path";
import pc from "picocolors";
import type { BesaConfig } from "./config.js";
import { fileExists } from "./utils/fs.js";
import { toKebabCase } from "./utils/naming.js";

function pass(msg: string): void {
  console.log(pc.green("  ✓") + " " + msg);
}

function fail(msg: string): void {
  console.log(pc.red("  ✗") + " " + msg);
}

async function checkGeneratedFilesExist(
  cwd: string,
  config: BesaConfig
): Promise<boolean> {
  console.log(pc.bold("\nCheck 1: Generated files exist"));
  let allPassed = true;

  const requiredFiles: string[] = [
    path.join(cwd, "src", "besa-generated", "types", "aggregate-types.ts"),
    path.join(cwd, "src", "besa-generated", "types", "context-scope.ts"),
    path.join(cwd, "src", "besa-generated", "contracts", "mutation.ts"),
    path.join(cwd, "src", "besa-generated", "contracts", "query.ts"),
  ];

  for (const [aggName] of Object.entries(config.aggregates)) {
    const kebab = toKebabCase(aggName);
    requiredFiles.push(
      path.join(cwd, "src", "besa-generated", "repositories", `${kebab}-repository.ts`)
    );
  }

  const vias = new Set<string>();
  for (const ctx of Object.values(config.contexts)) {
    for (const ccr of ctx.cross_context_reads ?? []) {
      vias.add(ccr.via);
    }
  }
  for (const via of vias) {
    const kebab = toKebabCase(via);
    requiredFiles.push(
      path.join(cwd, "src", "besa-generated", "cross-context", `${kebab}-interface.ts`)
    );
  }

  for (const ucPath of Object.keys(config["use-cases"])) {
    const idx = ucPath.indexOf("/");
    const contextName = idx === -1 ? ucPath : ucPath.slice(0, idx);
    const useCaseName = idx === -1 ? ucPath : ucPath.slice(idx + 1);
    requiredFiles.push(
      path.join(cwd, "src", "besa-generated", "contracts", contextName, `${useCaseName}.ts`)
    );
  }

  for (const filePath of requiredFiles) {
    const exists = await fileExists(filePath);
    const relative = path.relative(cwd, filePath);
    if (exists) {
      pass(relative);
    } else {
      fail(`${relative} (missing — run besa generate)`);
      allPassed = false;
    }
  }

  return allPassed;
}

async function checkScaffoldFilesExist(
  cwd: string,
  config: BesaConfig
): Promise<boolean> {
  console.log(pc.bold("\nCheck 2: Scaffold files exist"));
  let allPassed = true;

  const scaffoldFiles: string[] = [];

  for (const [aggName, agg] of Object.entries(config.aggregates)) {
    scaffoldFiles.push(
      path.join(cwd, "src", "contexts", agg.context, "domain", `${toKebabCase(aggName)}.ts`)
    );
  }

  for (const ucPath of Object.keys(config["use-cases"])) {
    const idx = ucPath.indexOf("/");
    const contextName = idx === -1 ? ucPath : ucPath.slice(0, idx);
    const useCaseName = idx === -1 ? ucPath : ucPath.slice(idx + 1);
    const ucDir = path.join(cwd, "src", "contexts", contextName, "use-cases", useCaseName);
    scaffoldFiles.push(
      path.join(ucDir, "execute.ts"),
      path.join(ucDir, "handler.ts"),
      path.join(ucDir, "execute.test.ts")
    );
  }

  for (const filePath of scaffoldFiles) {
    const exists = await fileExists(filePath);
    const relative = path.relative(cwd, filePath);
    if (exists) {
      pass(relative);
    } else {
      fail(`${relative} (missing — run besa generate)`);
      allPassed = false;
    }
  }

  return allPassed;
}

async function checkCrossContextReadsConsistency(
  cwd: string,
  config: BesaConfig
): Promise<boolean> {
  console.log(pc.bold("\nCheck 3: cross_context_reads consistency"));
  let allPassed = true;
  void cwd;

  for (const [ucPath, uc] of Object.entries(config["use-cases"])) {
    const ccr = uc.cross_context_reads ?? [];
    if (ccr.length === 0) continue;

    const ctxCfg = config.contexts[uc.context];
    const declared = new Set(
      (ctxCfg?.cross_context_reads ?? []).map((r) => r.context)
    );

    for (const readCtx of ccr) {
      if (!declared.has(readCtx)) {
        fail(
          `use-cases.${ucPath}: cross_context_reads "${readCtx}" not declared in context "${uc.context}"`
        );
        allPassed = false;
      } else {
        pass(`use-cases.${ucPath}: cross_context_reads "${readCtx}" is declared`);
      }
    }
  }

  if (allPassed) {
    pass("all cross_context_reads references are consistent");
  }

  return allPassed;
}

export async function runCheck(
  cwd: string,
  config: BesaConfig
): Promise<boolean> {
  const r1 = await checkGeneratedFilesExist(cwd, config);
  const r2 = await checkScaffoldFilesExist(cwd, config);
  const r3 = await checkCrossContextReadsConsistency(cwd, config);
  return r1 && r2 && r3;
}
