import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { z } from "zod";

const CrossContextReadSchema = z.object({
  context: z.string(),
  via: z.string(),
});

const ContextConfigSchema = z.object({
  aggregates: z.array(z.string()),
  cross_context_reads: z.array(CrossContextReadSchema).optional(),
});

const AggregateConfigSchema = z.object({
  root: z.string(),
  entities: z.array(z.string()),
  context: z.string(),
});

const UseCaseConfigSchema = z.object({
  context: z.string(),
  type: z.enum(["mutation", "query"]),
  aggregates: z.array(z.string()),
  cross_context_reads: z.array(z.string()).optional(),
});

const BesaConfigSchema = z.object({
  version: z.literal(1),
  contexts: z.record(z.string(), ContextConfigSchema),
  aggregates: z.record(z.string(), AggregateConfigSchema),
  "use-cases": z.record(z.string(), UseCaseConfigSchema),
});

export type CrossContextRead = z.infer<typeof CrossContextReadSchema>;
export type ContextConfig = z.infer<typeof ContextConfigSchema>;
export type AggregateConfig = z.infer<typeof AggregateConfigSchema>;
export type UseCaseConfig = z.infer<typeof UseCaseConfigSchema>;
export type BesaConfig = z.infer<typeof BesaConfigSchema>;

export async function loadConfig(cwd: string): Promise<BesaConfig> {
  const configPath = path.join(cwd, "besa.config.yml");

  let raw: string;
  try {
    raw = await fs.readFile(configPath, "utf-8");
  } catch {
    throw new Error(`besa.config.yml not found at ${configPath}`);
  }

  const parsed: unknown = yaml.load(raw);
  const result = BesaConfigSchema.safeParse(parsed);

  if (!result.success) {
    const messages = result.error.errors
      .map((e) => `  ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(`Invalid besa.config.yml:\n${messages}`);
  }

  const config = result.data;

  // Cross-field validation 1: each context's aggregates must exist in aggregates section
  for (const [contextName, contextConfig] of Object.entries(config.contexts)) {
    for (const aggName of contextConfig.aggregates) {
      if (!(aggName in config.aggregates)) {
        throw new Error(
          `contexts.${contextName}.aggregates references unknown aggregate "${aggName}". ` +
            `Add it to the aggregates section.`
        );
      }
    }
  }

  // Cross-field validation 2: each aggregate's context must exist in contexts
  for (const [aggName, aggConfig] of Object.entries(config.aggregates)) {
    if (!(aggConfig.context in config.contexts)) {
      throw new Error(
        `aggregates.${aggName}.context references unknown context "${aggConfig.context}". ` +
          `Add it to the contexts section.`
      );
    }
  }

  const useCases = config["use-cases"];

  // Cross-field validation 3: each use-case's context must exist in contexts
  for (const [ucPath, ucConfig] of Object.entries(useCases)) {
    if (!(ucConfig.context in config.contexts)) {
      throw new Error(
        `use-cases.${ucPath}.context references unknown context "${ucConfig.context}". ` +
          `Add it to the contexts section.`
      );
    }
  }

  // Cross-field validation 4: each use-case's aggregates must belong to the use-case's declared context
  for (const [ucPath, ucConfig] of Object.entries(useCases)) {
    for (const aggName of ucConfig.aggregates) {
      const agg = config.aggregates[aggName];
      if (agg === undefined) {
        throw new Error(
          `use-cases.${ucPath}.aggregates references unknown aggregate "${aggName}".`
        );
      }
      if (agg.context !== ucConfig.context) {
        throw new Error(
          `use-cases.${ucPath}.aggregates includes "${aggName}" which belongs to context "${agg.context}", ` +
            `but this use-case is in context "${ucConfig.context}".`
        );
      }
    }
  }

  // Cross-field validation 5: each use-case's cross_context_reads must be declared at context level
  for (const [ucPath, ucConfig] of Object.entries(useCases)) {
    if (!ucConfig.cross_context_reads || ucConfig.cross_context_reads.length === 0) {
      continue;
    }
    const contextConfig = config.contexts[ucConfig.context];
    if (contextConfig === undefined) {
      continue; // already caught by validation 3
    }
    const declaredCrossContexts = new Set(
      (contextConfig.cross_context_reads ?? []).map((r) => r.context)
    );
    for (const readContext of ucConfig.cross_context_reads) {
      if (!declaredCrossContexts.has(readContext)) {
        throw new Error(
          `use-cases.${ucPath}.cross_context_reads includes "${readContext}", ` +
            `but context "${ucConfig.context}" does not declare a cross_context_reads entry for it.`
        );
      }
    }
  }

  return config;
}
