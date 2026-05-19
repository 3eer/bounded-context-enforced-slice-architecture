import fs from "node:fs/promises";
import path from "node:path";
import pc from "picocolors";

export async function writeFile(
  filePath: string,
  content: string,
  dryRun = false
): Promise<void> {
  if (dryRun) {
    console.log(pc.cyan(`  ~ would write  ${filePath}`));
    return;
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
  console.log(pc.green(`  ✓ wrote  ${filePath}`));
}

export async function writeFileOnce(
  filePath: string,
  content: string,
  dryRun = false
): Promise<boolean> {
  if (await fileExists(filePath)) {
    console.log(pc.yellow(`  ⟳ skip   ${filePath} (already exists)`));
    return false;
  }
  if (dryRun) {
    console.log(pc.cyan(`  ~ would write  ${filePath}`));
    return true;
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
  console.log(pc.green(`  ✓ wrote  ${filePath}`));
  return true;
}

export async function readFileOrNull(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function listFilesRecursive(dir: string): Promise<string[]> {
  const results: string[] = [];
  let entries: import("node:fs").Dirent[];
  try {
    entries = (await fs.readdir(dir, { withFileTypes: true })) as import("node:fs").Dirent[];
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dir, String(entry.name));
    if (entry.isDirectory()) {
      results.push(...(await listFilesRecursive(full)));
    } else {
      results.push(full);
    }
  }
  return results;
}
