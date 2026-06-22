#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import { scanRepo, toCsv, toJson, toMarkdown } from "../index";
import type { ScanOptions } from "../core/types";

interface CliArgs {
  command: string;
  repoPath: string;
  outDir: string;
  formats: string[];
  docsRoots?: string[];
  ignorePaths?: string[];
  checkScripts: boolean;
}

function printUsage(): void {
  console.log(`
ArchLens DocsGap — documentation drift checker

Usage:
  archlens-docsgap scan <repoPath> [options]

Options:
  --out <dir>            Output directory for reports (default: ./docsgap-report)
  --format <list>        Comma-separated: json,md,csv (default: json,md)
  --docs <list>          Comma-separated docs roots (default: README.md,docs/)
  --ignore <list>        Comma-separated path prefixes to ignore
  --no-check-scripts     Skip npm/yarn/pnpm script + node/python target validation
  -h, --help             Show this help

Example:
  archlens-docsgap scan ./my-project --format json,md,csv --out ./report
`);
}

function parseArgs(argv: string[]): CliArgs | null {
  if (argv.length === 0 || argv.includes("-h") || argv.includes("--help")) {
    return null;
  }

  const [command, repoPath, ...rest] = argv;
  const args: CliArgs = {
    command,
    repoPath,
    outDir: "./docsgap-report",
    formats: ["json", "md"],
    checkScripts: true,
  };

  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];
    const next = () => rest[++i];
    switch (token) {
      case "--out":
        args.outDir = next();
        break;
      case "--format":
        args.formats = next().split(",").map((s) => s.trim()).filter(Boolean);
        break;
      case "--docs":
        args.docsRoots = next().split(",").map((s) => s.trim()).filter(Boolean);
        break;
      case "--ignore":
        args.ignorePaths = next().split(",").map((s) => s.trim()).filter(Boolean);
        break;
      case "--no-check-scripts":
        args.checkScripts = false;
        break;
      default:
        console.error(`Unknown option: ${token}`);
        process.exit(1);
    }
  }

  return args;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  if (!args || args.command !== "scan" || !args.repoPath) {
    printUsage();
    process.exit(args ? 1 : 0);
  }

  const resolvedRepoPath = path.resolve(args!.repoPath);
  if (!fs.existsSync(resolvedRepoPath)) {
    console.error(`Error: repo path does not exist: ${resolvedRepoPath}`);
    process.exit(1);
  }

  const options: ScanOptions = {
    checkScripts: args!.checkScripts,
    ...(args!.docsRoots ? { docsRoots: args!.docsRoots } : {}),
    ...(args!.ignorePaths ? { ignorePaths: args!.ignorePaths } : {}),
  };

  const report = scanRepo(resolvedRepoPath, options);

  fs.mkdirSync(args!.outDir, { recursive: true });

  const writers: Record<string, () => string> = {
    json: () => toJson(report),
    md: () => toMarkdown(report),
    csv: () => toCsv(report),
  };

  for (const format of args!.formats) {
    const writer = writers[format];
    if (!writer) {
      console.error(`Unknown format "${format}", skipped. Valid formats: json, md, csv`);
      continue;
    }
    const ext = format === "md" ? "md" : format;
    const outPath = path.join(args!.outDir, `docsgap-report.${ext}`);
    fs.writeFileSync(outPath, writer(), "utf-8");
    console.log(`Wrote ${outPath}`);
  }

  for (const warning of report.warnings) {
    console.warn(`⚠ ${warning}`);
  }

  console.log("");
  console.log(
    `Summary: ${report.summary.deadPaths} dead path(s), ${report.summary.staleCommands} stale command(s), ` +
      `${report.summary.uncoveredFolders} uncovered folder(s), ${report.summary.warnings} warning(s).`
  );

  if (report.issues.length > 0) {
    process.exitCode = 2; // non-zero exit so CI can gate on drift, but distinct from a hard failure (1)
  }
}

main();
