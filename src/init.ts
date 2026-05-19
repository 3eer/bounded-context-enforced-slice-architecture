import fs from "node:fs/promises";
import path from "node:path";
import pc from "picocolors";

const TEMPLATE = `version: 1

contexts:
  example:
    aggregates: [example]

aggregates:
  example:
    root: Example
    entities: []
    context: example

use-cases:
  example/get-example:
    context: example
    type: query
    aggregates: [example]
`;

export async function runInit(cwd: string): Promise<void> {
  const configPath = path.join(cwd, "besa.config.yml");

  try {
    await fs.access(configPath);
    console.log(
      pc.yellow("  ⟳ skip  ") +
        "besa.config.yml already exists. Remove it first to re-initialize."
    );
    return;
  } catch {
    // file does not exist — proceed
  }

  await fs.writeFile(configPath, TEMPLATE, "utf-8");
  console.log(pc.green("  ✓ wrote ") + "besa.config.yml");
  console.log("");
  console.log("Next steps:");
  console.log(
    "  1. Edit " + pc.cyan("besa.config.yml") + " to declare your contexts, aggregates, and use-cases"
  );
  console.log("  2. Run " + pc.cyan("besa generate") + " to scaffold all files");
  console.log("  3. Run " + pc.cyan("besa check") + " in CI to keep declarations and implementation in sync");
}
