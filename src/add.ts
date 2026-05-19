import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import type { BesaConfig } from "./config.js";
import { loadConfig } from "./config.js";
import { runGenerate } from "./generate.js";

// ---------------------------------------------------------------------------
// add use-case
// ---------------------------------------------------------------------------

export interface AddUseCaseOptions {
  context: string;
  type: "mutation" | "query";
  aggregates: string[];
  crossContextReads?: string[] | undefined;
}

export async function runAddUseCase(
  cwd: string,
  useCasePath: string,
  options: AddUseCaseOptions
): Promise<void> {
  const configPath = path.join(cwd, "besa.config.yml");
  const config: BesaConfig = await loadConfig(cwd);

  if (useCasePath in config["use-cases"]) {
    throw new Error(`Use-case "${useCasePath}" is already declared in besa.config.yml`);
  }
  if (!(options.context in config.contexts)) {
    throw new Error(
      `Context "${options.context}" is not declared in besa.config.yml.\n` +
        `  Available contexts: ${Object.keys(config.contexts).join(", ")}\n` +
        `  Tip: run "besa add context ${options.context}" first.`
    );
  }

  const ctxConfig = config.contexts[options.context];
  if (ctxConfig === undefined) throw new Error(`Context "${options.context}" not found`);

  for (const aggName of options.aggregates) {
    if (!ctxConfig.aggregates.includes(aggName)) {
      throw new Error(
        `Aggregate "${aggName}" does not belong to context "${options.context}".\n` +
          `  Context "${options.context}" has aggregates: ${ctxConfig.aggregates.join(", ")}\n` +
          `  Tip: run "besa add aggregate ${aggName} --context ${options.context} --root <RootName>" first.`
      );
    }
  }

  if (options.crossContextReads && options.crossContextReads.length > 0) {
    const declared = new Set(
      (ctxConfig.cross_context_reads ?? []).map((c: { context: string }) => c.context)
    );
    for (const ccrName of options.crossContextReads) {
      if (!declared.has(ccrName)) {
        throw new Error(
          `Cross-context read "${ccrName}" is not declared in context "${options.context}".\n` +
            `  Declared cross_context_reads: ${[...declared].join(", ") || "(none)"}\n` +
            `  Tip: add a cross_context_reads entry for "${ccrName}" under contexts.${options.context} in besa.config.yml.`
        );
      }
    }
  }

  const rawYaml = await readConfigRaw(configPath);
  const parsed = yaml.load(rawYaml) as Record<string, unknown>;

  let useCases = parsed["use-cases"] as Record<string, unknown> | undefined;
  if (useCases === undefined) { useCases = {}; parsed["use-cases"] = useCases; }

  const newEntry: Record<string, unknown> = {
    context: options.context,
    type: options.type,
    aggregates: options.aggregates,
  };
  if (options.crossContextReads && options.crossContextReads.length > 0) {
    newEntry["cross_context_reads"] = options.crossContextReads;
  }
  useCases[useCasePath] = newEntry;

  await writeConfigRaw(configPath, parsed);
  console.log(`Updated besa.config.yml — added use-case "${useCasePath}"`);

  await runGenerate(cwd, await loadConfig(cwd));
}

// ---------------------------------------------------------------------------
// add context
// ---------------------------------------------------------------------------

export interface AddContextOptions {
  aggregates?: string[] | undefined;
}

export async function runAddContext(
  cwd: string,
  contextName: string,
  options: AddContextOptions
): Promise<void> {
  const configPath = path.join(cwd, "besa.config.yml");
  const config: BesaConfig = await loadConfig(cwd);

  if (contextName in config.contexts) {
    throw new Error(`Context "${contextName}" is already declared in besa.config.yml`);
  }
  if (!/^[a-z][a-z0-9-]*$/.test(contextName)) {
    throw new Error(
      `Context name "${contextName}" is invalid.\n` +
        `  Must be lowercase kebab-case (e.g. "catalog", "order-management").`
    );
  }

  const rawYaml = await readConfigRaw(configPath);
  const parsed = yaml.load(rawYaml) as Record<string, unknown>;

  const contexts = parsed["contexts"] as Record<string, unknown>;
  contexts[contextName] = { aggregates: options.aggregates ?? [] };

  await writeConfigRaw(configPath, parsed);
  console.log(`Updated besa.config.yml — added context "${contextName}"`);

  await runGenerate(cwd, await loadConfig(cwd));
}

// ---------------------------------------------------------------------------
// add aggregate
// ---------------------------------------------------------------------------

export interface AddAggregateOptions {
  context: string;
  root: string;
  entities?: string[] | undefined;
}

export async function runAddAggregate(
  cwd: string,
  aggregateName: string,
  options: AddAggregateOptions
): Promise<void> {
  const configPath = path.join(cwd, "besa.config.yml");
  const config: BesaConfig = await loadConfig(cwd);

  if (aggregateName in config.aggregates) {
    throw new Error(`Aggregate "${aggregateName}" is already declared in besa.config.yml`);
  }
  if (!/^[a-z][a-z0-9-]*$/.test(aggregateName)) {
    throw new Error(
      `Aggregate name "${aggregateName}" is invalid.\n` +
        `  Must be lowercase kebab-case (e.g. "cart", "product-variant").`
    );
  }
  if (!(options.context in config.contexts)) {
    throw new Error(
      `Context "${options.context}" is not declared in besa.config.yml.\n` +
        `  Available contexts: ${Object.keys(config.contexts).join(", ")}\n` +
        `  Tip: run "besa add context ${options.context}" first.`
    );
  }
  if (!/^[A-Z]/.test(options.root)) {
    throw new Error(
      `Root entity name "${options.root}" is invalid.\n` +
        `  Must be PascalCase (e.g. "Cart", "ProductVariant").`
    );
  }

  const rawYaml = await readConfigRaw(configPath);
  const parsed = yaml.load(rawYaml) as Record<string, unknown>;

  // Add to aggregates section
  const aggregates = parsed["aggregates"] as Record<string, unknown>;
  aggregates[aggregateName] = {
    root: options.root,
    entities: options.entities ?? [],
    context: options.context,
  };

  // Register in context's aggregates list
  const contexts = parsed["contexts"] as Record<string, Record<string, unknown>>;
  const ctx = contexts[options.context];
  if (ctx !== undefined) {
    const existing = (ctx["aggregates"] as string[] | undefined) ?? [];
    if (!existing.includes(aggregateName)) {
      ctx["aggregates"] = [...existing, aggregateName];
    }
  }

  await writeConfigRaw(configPath, parsed);
  console.log(`Updated besa.config.yml — added aggregate "${aggregateName}" to context "${options.context}"`);

  await runGenerate(cwd, await loadConfig(cwd));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function readConfigRaw(configPath: string): Promise<string> {
  try {
    return await fs.readFile(configPath, "utf-8");
  } catch {
    throw new Error(`besa.config.yml not found at ${configPath}`);
  }
}

async function writeConfigRaw(configPath: string, parsed: Record<string, unknown>): Promise<void> {
  const updatedYaml = yaml.dump(parsed, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    quotingType: "'",
  });
  await fs.writeFile(configPath, updatedYaml, "utf-8");
}
