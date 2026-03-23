#!/usr/bin/env node

const { buildContextWindow } = require("./session-memory");
const { scanProject } = require("./project-scan");

function splitList(value) {
  return String(value || "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseArgs(argv) {
  const args = {
    cwd: process.cwd(),
    task: "",
    taskType: "feature",
    files: "",
    contextUsage: null,
    warnAt: 70,
    saveAt: 85,
    closeAt: 95,
    brownfield: false,
    needsUi: false,
    needsBackend: false,
    needsDb: false,
    needsResearch: false,
    needsDeploy: false,
    needsSecurity: false,
    needsPerformance: false,
    needsTesting: false,
    printJson: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--cwd" && next) {
      args.cwd = next;
      i += 1;
    } else if (arg === "--task" && next) {
      args.task = next;
      i += 1;
    } else if (arg === "--task-type" && next) {
      args.taskType = next;
      i += 1;
    } else if (arg === "--files" && next) {
      args.files = next;
      i += 1;
    } else if (arg === "--context-usage" && next) {
      args.contextUsage = Number(next);
      i += 1;
    } else if (arg === "--warn-at" && next) {
      args.warnAt = Number(next);
      i += 1;
    } else if (arg === "--save-at" && next) {
      args.saveAt = Number(next);
      i += 1;
    } else if (arg === "--close-at" && next) {
      args.closeAt = Number(next);
      i += 1;
    } else if (arg === "--brownfield") {
      args.brownfield = true;
    } else if (arg === "--needs-ui") {
      args.needsUi = true;
    } else if (arg === "--needs-backend") {
      args.needsBackend = true;
    } else if (arg === "--needs-db") {
      args.needsDb = true;
    } else if (arg === "--needs-research") {
      args.needsResearch = true;
    } else if (arg === "--needs-deploy") {
      args.needsDeploy = true;
    } else if (arg === "--needs-security") {
      args.needsSecurity = true;
    } else if (arg === "--needs-performance") {
      args.needsPerformance = true;
    } else if (arg === "--needs-testing") {
      args.needsTesting = true;
    } else if (arg === "--print-json") {
      args.printJson = true;
    }
  }

  return args;
}

function unique(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

function buildWorkflow(args) {
  const scan = scanProject(args.cwd);
  const contextWindow = buildContextWindow({
    contextUsage: args.contextUsage,
    warnAt: args.warnAt,
    saveAt: args.saveAt,
    closeAt: args.closeAt,
  });
  const files = splitList(args.files);
  const effectiveBrownfield = args.brownfield || scan.conventions.brownfield;
  const planRequired =
    args.taskType === "feature" ||
    args.taskType === "architecture" ||
    args.taskType === "deploy" ||
    files.length >= 3 ||
    [
      args.needsUi,
      args.needsBackend,
      args.needsDb,
      args.needsResearch,
      args.needsDeploy,
      args.needsSecurity,
      args.needsPerformance,
      args.needsTesting,
    ].filter(Boolean).length >= 2;

  const preflight = [];

  if (contextWindow.closeRecommended) {
    preflight.push("Run session-guard and resume in a fresh session before doing more work.");
  } else if (contextWindow.recommendedAction === "save-now") {
    preflight.push("Checkpoint immediately before starting the task.");
  } else if (contextWindow.recommendedAction === "reduce-context-growth") {
    preflight.push("Tighten scope before reading more files or spawning agents.");
  }

  if (effectiveBrownfield) {
    preflight.push("Run project-scan and brownfield-onboarding before planning implementation.");
  }

  const skills = [];
  const agents = [];
  const phases = [];

  if (effectiveBrownfield) {
    skills.push("brownfield-onboarding");
    phases.push("Scan the existing repo and capture stack, commands, and no-touch zones.");
  }

  if (planRequired) {
    agents.push("planner");
    agents.push("workflow-orchestrator");
    phases.push("Write an execution plan before touching code.");
  }

  if (args.needsResearch || args.taskType === "research") {
    agents.push("researcher");
    phases.push("Research choices in parallel before implementation.");
  }

  if (args.taskType === "bug") {
    skills.push("error-analyzer", "bug-hunter");
    agents.push("test-writer");
    phases.push("Reproduce the bug, identify root cause, then write the regression test.");
  }

  if (args.needsBackend) agents.push("backend-engineer");
  if (args.needsUi) agents.push("frontend-designer");
  if (args.needsDb) agents.push("db-architect");
  if (args.needsDeploy) agents.push("devops-engineer");
  if (args.needsPerformance) agents.push("performance-analyst");
  if (args.needsSecurity) agents.push("security-auditor");
  if (args.needsTesting || args.taskType === "feature" || args.taskType === "bug") {
    agents.push("test-writer");
  }

  phases.push("Execute implementation in parallel workstreams where file ownership is disjoint.");

  if (args.taskType !== "research") {
    agents.push("code-reviewer");
    if (!args.needsSecurity) {
      agents.push("security-auditor");
    }
    skills.push("human-review-handoff");
    phases.push("Run review loop: tests, security review, code review, and human handoff summary.");
  }

  if (args.needsDeploy || args.taskType === "deploy") {
    skills.push("vps-deploy");
    phases.push("Ship only after the review loop passes.");
  }

  if (contextWindow.usagePercent !== null && contextWindow.usagePercent >= contextWindow.thresholds.warn) {
    agents.push("context-sentinel");
  }

  return {
    task: args.task || "unspecified task",
    taskType: args.taskType,
    project: scan,
    contextWindow,
    planRequired,
    preflight,
    phases,
    skills: unique(skills),
    agents: unique(agents),
    files,
    executionNotes: [
      "Use /plan before /execute for multi-step work.",
      "Keep main context lean: explore through agents, not broad main-session scans.",
      "Checkpoint at 85% used and stop at 95% used.",
    ],
  };
}

function formatList(items, fallback) {
  if (!items || items.length === 0) {
    return `- ${fallback}`;
  }

  return items.map((item) => `- ${item}`).join("\n");
}

function renderWorkflow(workflow) {
  return `TASK ORCHESTRATION
────────────────────────
Task:           ${workflow.task}
Type:           ${workflow.taskType}
Plan required:  ${workflow.planRequired ? "yes" : "no"}
Context:        ${
    workflow.contextWindow.usagePercent === null
      ? "not recorded"
      : `${workflow.contextWindow.usagePercent}% used / ${workflow.contextWindow.remainingPercent}% left`
  }
Policy:         ${workflow.contextWindow.policy}

Preflight:
${formatList(workflow.preflight, "No extra preflight steps required.")}

Phases:
${formatList(workflow.phases, "No phases generated.")}

Agents:
${formatList(workflow.agents, "No agents selected.")}

Skills:
${formatList(workflow.skills, "No skills selected.")}

Files:
${formatList(workflow.files, "No file list provided.")}

Notes:
${formatList(workflow.executionNotes, "No extra notes.")}
`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const workflow = buildWorkflow(args);

  if (args.printJson) {
    process.stdout.write(`${JSON.stringify(workflow, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${renderWorkflow(workflow)}\n`);
}

module.exports = {
  buildWorkflow,
  renderWorkflow,
};

if (require.main === module) {
  main();
}
