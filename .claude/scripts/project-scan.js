#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return null;
  }
}

function exists(root, relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function listTopDirs(root) {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules")
    .map((entry) => entry.name)
    .slice(0, 20);
}

function detectPackageManager(root) {
  if (exists(root, "pnpm-lock.yaml")) return "pnpm";
  if (exists(root, "yarn.lock")) return "yarn";
  if (exists(root, "bun.lockb") || exists(root, "bun.lock")) return "bun";
  if (exists(root, "package-lock.json")) return "npm";
  return "unknown";
}

function detectNodeFrameworks(pkg = {}) {
  const deps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };

  const frameworks = [];

  if (deps.next) frameworks.push("Next.js");
  if (deps.react) frameworks.push("React");
  if (deps.express) frameworks.push("Express");
  if (deps.fastify) frameworks.push("Fastify");
  if (deps["@nestjs/core"]) frameworks.push("NestJS");
  if (deps.vite) frameworks.push("Vite");
  if (deps.prisma) frameworks.push("Prisma");
  if (deps.drizzle) frameworks.push("Drizzle");
  if (deps.tailwindcss) frameworks.push("Tailwind");
  if (deps.vitest || deps.jest) frameworks.push("Unit tests configured");

  return frameworks;
}

function detectStack(root) {
  const packageJsonPath = path.join(root, "package.json");
  const pyprojectPath = path.join(root, "pyproject.toml");
  const goModPath = path.join(root, "go.mod");
  const cargoPath = path.join(root, "Cargo.toml");

  if (fs.existsSync(packageJsonPath)) {
    const pkg = safeReadJson(packageJsonPath) || {};

    return {
      type: "node",
      packageManager: detectPackageManager(root),
      packageJson: pkg,
      frameworks: detectNodeFrameworks(pkg),
      scripts: pkg.scripts || {},
    };
  }

  if (fs.existsSync(pyprojectPath)) {
    return {
      type: "python",
      packageManager: exists(root, "poetry.lock") ? "poetry" : "pip",
      frameworks: [
        fs.readFileSync(pyprojectPath, "utf8").includes("fastapi") ? "FastAPI" : null,
        fs.readFileSync(pyprojectPath, "utf8").includes("django") ? "Django" : null,
        fs.readFileSync(pyprojectPath, "utf8").includes("pytest") ? "Pytest" : null,
      ].filter(Boolean),
      scripts: {},
    };
  }

  if (fs.existsSync(goModPath)) {
    return {
      type: "go",
      packageManager: "go",
      frameworks: [
        fs.readFileSync(goModPath, "utf8").includes("github.com/gofiber/fiber") ? "Fiber" : null,
      ].filter(Boolean),
      scripts: {},
    };
  }

  if (fs.existsSync(cargoPath)) {
    return {
      type: "rust",
      packageManager: "cargo",
      frameworks: [],
      scripts: {},
    };
  }

  return {
    type: "unknown",
    packageManager: "unknown",
    frameworks: [],
    scripts: {},
  };
}

function detectConventions(root, stack) {
  const candidates = [
    { file: "src", role: "Primary application source" },
    { file: "app", role: "Framework app directory" },
    { file: "client", role: "Frontend app" },
    { file: "server", role: "Backend/server code" },
    { file: "tests", role: "Test suite" },
    { file: "prisma", role: "Prisma schema and migrations" },
    { file: "docs", role: "Plans, audits, and design docs" },
    { file: ".github", role: "Automation and CI" },
  ];

  const found = candidates.filter((candidate) => exists(root, candidate.file));
  const commands = [];

  if (stack.type === "node") {
    if (stack.scripts.dev) commands.push(`${stack.packageManager} run dev`);
    if (stack.scripts.build) commands.push(`${stack.packageManager} run build`);
    if (stack.scripts.test) commands.push(`${stack.packageManager} run test`);
    if (stack.scripts.lint) commands.push(`${stack.packageManager} run lint`);
    if (stack.scripts.typecheck) commands.push(`${stack.packageManager} run typecheck`);
  }

  if (stack.type === "python") {
    commands.push("pytest");
  }

  if (stack.type === "go") {
    commands.push("go test ./...");
  }

  return {
    keyPaths: found,
    likelyCommands: commands,
    brownfield: found.length > 0 || stack.type !== "unknown",
  };
}

function scanProject(root = process.cwd()) {
  const absoluteRoot = path.resolve(root);
  const stack = detectStack(absoluteRoot);
  const conventions = detectConventions(absoluteRoot, stack);

  return {
    root: absoluteRoot,
    stack,
    conventions,
    topDirectories: listTopDirs(absoluteRoot),
    hasGit: exists(absoluteRoot, ".git"),
    hasClaudeForge: exists(absoluteRoot, "CLAUDE.md") && exists(absoluteRoot, "memory"),
  };
}

function renderScan(scan) {
  const frameworks = scan.stack.frameworks.length > 0 ? scan.stack.frameworks.join(", ") : "none detected";
  const scripts =
    Object.keys(scan.stack.scripts || {}).length > 0
      ? Object.entries(scan.stack.scripts)
          .slice(0, 8)
          .map(([name, command]) => `- ${name}: ${command}`)
          .join("\n")
      : "- none detected";
  const keyPaths =
    scan.conventions.keyPaths.length > 0
      ? scan.conventions.keyPaths.map((entry) => `- ${entry.file}: ${entry.role}`).join("\n")
      : "- none detected";
  const commands =
    scan.conventions.likelyCommands.length > 0
      ? scan.conventions.likelyCommands.map((command) => `- ${command}`).join("\n")
      : "- none detected";

  return `PROJECT SCAN
────────────────────────
Root:           ${scan.root}
Git:            ${scan.hasGit ? "yes" : "no"}
Claude Forge:   ${scan.hasClaudeForge ? "yes" : "no"}
Stack:          ${scan.stack.type}
Package mgr:    ${scan.stack.packageManager}
Frameworks:     ${frameworks}
Brownfield:     ${scan.conventions.brownfield ? "yes" : "no"}

Key paths:
${keyPaths}

Likely commands:
${commands}

Scripts:
${scripts}
`;
}

function parseArgs(argv) {
  const args = {
    cwd: process.cwd(),
    printJson: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--cwd" && next) {
      args.cwd = next;
      i += 1;
    } else if (arg === "--print-json") {
      args.printJson = true;
    }
  }

  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const scan = scanProject(args.cwd);

  if (args.printJson) {
    process.stdout.write(`${JSON.stringify(scan, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${renderScan(scan)}\n`);
}

module.exports = {
  detectConventions,
  detectPackageManager,
  detectStack,
  renderScan,
  scanProject,
};

if (require.main === module) {
  main();
}
