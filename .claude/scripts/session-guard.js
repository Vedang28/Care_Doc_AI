#!/usr/bin/env node

const {
  buildContextWindow,
  renderResumeBrief,
  writeSession,
} = require("./session-memory");

function parseArgs(argv) {
  const args = {
    label: "focus-session",
    summary: "",
    inProgress: "",
    next: "",
    blockers: "",
    files: "",
    commands: "",
    mustRemember: "",
    decisions: "",
    questions: "",
    cwd: process.cwd(),
    claudeDir: "",
    contextUsage: null,
    warnAt: 70,
    saveAt: 85,
    closeAt: 95,
    autoClose: false,
    printJson: false,
    forceSave: false,
    closeExitCode: 0,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--label" && next) {
      args.label = next;
      i += 1;
    } else if (arg === "--summary" && next) {
      args.summary = next;
      i += 1;
    } else if (arg === "--in-progress" && next) {
      args.inProgress = next;
      i += 1;
    } else if (arg === "--next" && next) {
      args.next = next;
      i += 1;
    } else if (arg === "--blockers" && next) {
      args.blockers = next;
      i += 1;
    } else if (arg === "--files" && next) {
      args.files = next;
      i += 1;
    } else if (arg === "--commands" && next) {
      args.commands = next;
      i += 1;
    } else if (arg === "--must-remember" && next) {
      args.mustRemember = next;
      i += 1;
    } else if (arg === "--decisions" && next) {
      args.decisions = next;
      i += 1;
    } else if (arg === "--questions" && next) {
      args.questions = next;
      i += 1;
    } else if (arg === "--cwd" && next) {
      args.cwd = next;
      i += 1;
    } else if (arg === "--claude-dir" && next) {
      args.claudeDir = next;
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
    } else if (arg === "--close-exit-code" && next) {
      args.closeExitCode = Number(next);
      i += 1;
    } else if (arg === "--auto-close") {
      args.autoClose = true;
    } else if (arg === "--print-json") {
      args.printJson = true;
    } else if (arg === "--force-save") {
      args.forceSave = true;
    }
  }

  return args;
}

function buildDecision(args) {
  const contextWindow = buildContextWindow({
    contextUsage: args.contextUsage,
    warnAt: args.warnAt,
    saveAt: args.saveAt,
    closeAt: args.closeAt,
  });

  if (args.forceSave) {
    return {
      contextWindow,
      shouldSave: true,
      reason: "manual-save",
      closeRequested: args.autoClose && contextWindow.closeRecommended,
    };
  }

  if (contextWindow.closeRecommended) {
    return {
      contextWindow,
      shouldSave: true,
      reason: "context-threshold",
      closeRequested: args.autoClose,
    };
  }

  if (contextWindow.recommendedAction === "save-now") {
    return {
      contextWindow,
      shouldSave: true,
      reason: "checkpoint-threshold",
      closeRequested: false,
    };
  }

  return {
    contextWindow,
    shouldSave: false,
    reason: "continue",
    closeRequested: false,
  };
}

function printStatus(decision) {
  const { contextWindow, shouldSave, reason, closeRequested } = decision;
  const usage =
    contextWindow.usagePercent === null
      ? "not recorded"
      : `${contextWindow.usagePercent}% used / ${contextWindow.remainingPercent}% left`;

  process.stdout.write("Session Guard\n");
  process.stdout.write(`Context: ${usage}\n`);
  process.stdout.write(`Policy: ${contextWindow.policy}\n`);
  process.stdout.write(`Decision: ${shouldSave ? reason : "continue"}\n`);

  if (closeRequested) {
    process.stdout.write("Close requested after save.\n");
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const decision = buildDecision(args);

  printStatus(decision);

  if (!decision.shouldSave) {
    if (args.printJson) {
      process.stdout.write(
        `${JSON.stringify(
          {
            shouldSave: false,
            reason: decision.reason,
            contextWindow: decision.contextWindow,
          },
          null,
          2,
        )}\n`,
      );
    }
    return;
  }

  const result = writeSession(
    {
      label: args.label,
      reason: decision.reason,
      summary: args.summary,
      inProgress: args.inProgress,
      next: args.next,
      blockers: args.blockers,
      files: args.files,
      commands: args.commands,
      mustRemember: args.mustRemember,
      decisions: args.decisions,
      questions: args.questions,
      contextUsage: args.contextUsage,
      warnAt: args.warnAt,
      saveAt: args.saveAt,
      closeAt: args.closeAt,
    },
    args,
  );

  process.stdout.write(`\n${renderResumeBrief(result.data)}\n`);
  process.stdout.write(`\nSaved compact session memory:\n- ${result.jsonPath}\n- ${result.handoffPath}\n`);

  if (args.printJson) {
    process.stdout.write(
      `${JSON.stringify(
        {
          shouldSave: true,
          reason: decision.reason,
          closeRequested: decision.closeRequested,
          contextWindow: result.data.session.contextWindow,
          jsonPath: result.jsonPath,
          handoffPath: result.handoffPath,
        },
        null,
        2,
      )}\n`,
    );
  }

  if (decision.closeRequested && Number.isFinite(args.closeExitCode) && args.closeExitCode !== 0) {
    process.exit(args.closeExitCode);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
