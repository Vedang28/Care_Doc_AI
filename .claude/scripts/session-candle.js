#!/usr/bin/env node

const readline = require("readline");
const {
  buildContextWindow,
  loadCurrentContext,
  renderResumeBrief,
  writeSession,
} = require("./session-memory");

function parseArgs(argv) {
  const args = {
    minutes: 45,
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
    nonInteractive: false,
    showLatest: false,
    handleSigint: false,
    autoClose: false,
    printJson: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--minutes" && next) {
      args.minutes = Number(next);
      i += 1;
    } else if (arg === "--label" && next) {
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
    } else if (arg === "--show-latest") {
      args.showLatest = true;
    } else if (arg === "--non-interactive") {
      args.nonInteractive = true;
    } else if (arg === "--auto-close") {
      args.autoClose = true;
    } else if (arg === "--print-json") {
      args.printJson = true;
    }
  }

  return args;
}

function percentageBar(percent) {
  if (!Number.isFinite(percent)) {
    return "[--------------------] n/a";
  }

  const width = 20;
  const filled = Math.round((Math.max(0, Math.min(100, percent)) / 100) * width);

  return `[${"#".repeat(filled)}${"-".repeat(width - filled)}] ${percent}%`;
}

function candleLines(remainingSeconds, totalSeconds, contextWindow) {
  const timeFraction = totalSeconds <= 0 ? 0 : remainingSeconds / totalSeconds;
  const contextFraction =
    contextWindow.usagePercent === null ? 1 : Math.max(0, contextWindow.remainingPercent / 100);
  const fraction = Math.min(timeFraction, contextFraction);
  const bodyHeight = Math.max(1, Math.ceil(fraction * 8));
  const flame = remainingSeconds > 0 ? ["      ( )", "       )(", "      ( )"] : ["", "       .", ""];
  const body = Array.from({ length: bodyHeight }, () => "       ||");
  const melted = Array.from({ length: 8 - bodyHeight }, () => "       ::");

  return [
    "",
    ...flame,
    ...body,
    ...melted,
    "     __||__",
    "    |______|",
    "",
  ].join("\n");
}

function clearScreen() {
  process.stdout.write("\x1Bc");
}

function renderTimer(label, remainingSeconds, totalSeconds, contextWindow) {
  const mins = Math.floor(remainingSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(remainingSeconds % 60)
    .toString()
    .padStart(2, "0");

  clearScreen();
  process.stdout.write("Session Candle\n");
  process.stdout.write(`Label: ${label}\n`);
  process.stdout.write(`Time Left: ${mins}:${secs}\n`);
  process.stdout.write(`Context Used: ${percentageBar(contextWindow.usagePercent)}\n`);
  process.stdout.write(`Context Left: ${percentageBar(contextWindow.remainingPercent)}\n`);
  process.stdout.write(
    `Policy: warn ${contextWindow.thresholds.warn}% / save ${contextWindow.thresholds.save}% / stop ${contextWindow.thresholds.close}%\n`,
  );
  process.stdout.write(`Recommended: ${contextWindow.recommendedAction}\n`);
  process.stdout.write(candleLines(remainingSeconds, totalSeconds, contextWindow));
  process.stdout.write("Ctrl+C saves a compact handoff immediately.\n");
}

async function askQuestions(reason, defaults) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (question) =>
    new Promise((resolve) => {
      rl.question(question, (answer) => resolve(answer.trim()));
    });

  const summary = (await ask("Completed: ")) || defaults.summary;
  const inProgress = (await ask("In progress: ")) || defaults.inProgress;
  const next = (await ask("Next steps (use | to separate): ")) || defaults.next;
  const blockers = (await ask("Blockers (use | to separate): ")) || defaults.blockers;
  const files = (await ask("Open first files (use | to separate): ")) || defaults.files;
  const commands = (await ask("Commands to reuse (use | to separate): ")) || defaults.commands;
  const mustRemember = (await ask("Must remember (use | to separate): ")) || defaults.mustRemember;
  const decisions = (await ask("Recent decisions (use | to separate): ")) || defaults.decisions;
  const questions = (await ask("Open questions (use | to separate): ")) || defaults.questions;

  rl.close();

  return {
    reason,
    summary,
    inProgress,
    next,
    blockers,
    files,
    commands,
    mustRemember,
    decisions,
    questions,
  };
}

async function saveClaudeSession(reason, rawArgs = {}) {
  const isInteractive = process.stdout.isTTY && process.stdin.isTTY && !rawArgs.nonInteractive;

  const answers = isInteractive
    ? await askQuestions(reason, rawArgs)
    : {
        reason,
        summary: rawArgs.summary,
        inProgress: rawArgs.inProgress,
        next: rawArgs.next,
      blockers: rawArgs.blockers,
      files: rawArgs.files,
      commands: rawArgs.commands,
      mustRemember: rawArgs.mustRemember,
      decisions: rawArgs.decisions,
        questions: rawArgs.questions,
      };

  return writeSession({
    label: rawArgs.label,
    reason: answers.reason,
    summary: answers.summary,
    inProgress: answers.inProgress,
    next: answers.next,
    blockers: answers.blockers,
    files: answers.files,
    commands: answers.commands,
    mustRemember: answers.mustRemember,
    decisions: answers.decisions,
    questions: answers.questions,
    contextUsage: rawArgs.contextUsage,
    warnAt: rawArgs.warnAt,
    saveAt: rawArgs.saveAt,
    closeAt: rawArgs.closeAt,
  }, rawArgs);
}

function showLatestContext(rawArgs = {}) {
  const latest = loadCurrentContext(rawArgs);

  if (!latest) {
    process.stdout.write("No memory/current-context.json found.\n");
    return null;
  }

  process.stdout.write(`${renderResumeBrief(latest.data)}\n`);
  return latest;
}

async function startSessionCandle(rawArgs = {}) {
  const args = {
    ...parseArgs([]),
    ...rawArgs,
  };
  const contextWindow = buildContextWindow({
    contextUsage: args.contextUsage,
    warnAt: args.warnAt,
    saveAt: args.saveAt,
    closeAt: args.closeAt,
  });
  const totalSeconds = Math.max(0, Math.round(Number(args.minutes) * 60));

  if (args.showLatest) {
    return showLatestContext(args);
  }

  if (args.autoClose && contextWindow.closeRecommended) {
    return saveClaudeSession("context-threshold", args);
  }

  if (totalSeconds === 0) {
    return saveClaudeSession("manual-save", args);
  }

  return new Promise((resolve, reject) => {
    let remainingSeconds = totalSeconds;
    let finished = false;
    let intervalId = null;

    const stop = async (reason) => {
      if (finished) {
        return;
      }

      finished = true;
      clearInterval(intervalId);
      clearScreen();

      try {
        const result = await saveClaudeSession(reason, args);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    const sigintHandler = async () => {
      process.off("SIGINT", sigintHandler);
      await stop("manual-stop");
    };

    if (args.handleSigint) {
      process.on("SIGINT", sigintHandler);
    }

    renderTimer(args.label, remainingSeconds, totalSeconds, contextWindow);

    intervalId = setInterval(async () => {
      remainingSeconds -= 1;
      renderTimer(args.label, remainingSeconds, totalSeconds, contextWindow);

      if (remainingSeconds <= 0) {
        if (args.handleSigint) {
          process.off("SIGINT", sigintHandler);
        }
        await stop("timeout");
      }
    }, 1000);
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await startSessionCandle({
    ...args,
    handleSigint: true,
  });

  if (!args.showLatest && result && result.jsonPath) {
    process.stdout.write(`\nSaved compact session memory:\n- ${result.jsonPath}\n- ${result.handoffPath}\n`);

    if (args.autoClose && result.data?.session?.contextWindow?.closeRecommended) {
      process.stdout.write("Context threshold reached. End this session and resume in a fresh one.\n");
    }
  }

  if (args.printJson && result && result.data) {
    process.stdout.write(`${JSON.stringify(result.data, null, 2)}\n`);
  }
}

module.exports = {
  loadCurrentContext,
  parseArgs,
  saveClaudeSession,
  showLatestContext,
  startSessionCandle,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
