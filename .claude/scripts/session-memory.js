const fs = require("fs");
const path = require("path");

const DEFAULT_OPEN_FIRST_LIMIT = 5;
const DEFAULT_RECENT_FILE_LIMIT = 4;
const DEFAULT_CHECKPOINT_HISTORY_LIMIT = 25;
const DEFAULT_CONTEXT_WARN_PERCENT = 70;
const DEFAULT_CONTEXT_SAVE_PERCENT = 85;
const DEFAULT_CONTEXT_CLOSE_PERCENT = 95;
const SESSION_LOG_MARKER = "<!-- /session-end writes new entries here, above this line -->";
const DECISIONS_MARKER = "<!-- New decisions go here, newest first -->";
const AVOID_READING = [
  "Read memory/current-context.json first.",
  "Do not scan the full repo unless the brief is missing something critical.",
  "Do not open memory/decisions.md, memory/patterns.md, or memory/errors.md unless the current task needs them.",
];
const RECENT_FILE_PATTERNS = [
  /^PRIORITY-WORK\.md$/i,
  /^README\.md$/i,
  /^CLAUDE\.md$/i,
  /^ADR\.md$/i,
  /^lessons\.md$/i,
];
const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
]);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function splitList(value) {
  return String(value || "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

function uniqueList(items) {
  return Array.from(new Set((items || []).filter(Boolean)));
}

function clampNumber(value, { min = 0, max = 100, fallback = null } = {}) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numeric));
}

function formatList(items, fallback) {
  const normalized = Array.isArray(items) ? items.filter(Boolean) : splitList(items);

  if (normalized.length === 0) {
    return `- ${fallback}`;
  }

  return normalized.map((item) => `- ${item}`).join("\n");
}

function escapePipes(value) {
  return String(value || "").replace(/\|/g, "\\|");
}

function nextStepsMarkdown(items) {
  const normalized = Array.isArray(items) ? items.filter(Boolean) : splitList(items);

  if (normalized.length === 0) {
    return "1. Continue from the current priority.";
  }

  return normalized.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function formatDateStamp(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function resolveClaudeRoot(cwd = process.cwd(), claudeDir) {
  if (claudeDir) {
    return path.resolve(cwd, claudeDir);
  }

  const inferredRoot = path.resolve(__dirname, "..");
  const looksLikeClaudeRoot =
    fs.existsSync(path.join(inferredRoot, "CLAUDE.md")) &&
    fs.existsSync(path.join(inferredRoot, "memory"));

  if (looksLikeClaudeRoot) {
    return inferredRoot;
  }

  return path.resolve(cwd);
}

function walkFiles(rootDir, baseDir = rootDir, collector = []) {
  if (!fs.existsSync(rootDir)) {
    return collector;
  }

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const absolutePath = path.join(rootDir, entry.name);
    const relativePath = path.relative(baseDir, absolutePath);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }

      walkFiles(absolutePath, baseDir, collector);
      continue;
    }

    const stats = fs.statSync(absolutePath);
    collector.push({
      absolutePath,
      relativePath,
      mtimeMs: stats.mtimeMs,
    });
  }

  return collector;
}

function detectRecentFiles(claudeRoot, limit = DEFAULT_RECENT_FILE_LIMIT) {
  return walkFiles(claudeRoot)
    .filter((file) => RECENT_FILE_PATTERNS.some((pattern) => pattern.test(path.basename(file.relativePath))))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, limit)
    .map((file) => file.relativePath);
}

function detectSuggestedFiles(claudeRoot, explicitFiles = [], limit = DEFAULT_RECENT_FILE_LIMIT) {
  return uniqueList([
    ...explicitFiles,
    ...detectRecentFiles(claudeRoot, limit + 2),
  ])
    .filter(
      (filePath) =>
        !["memory/current-context.json", "PRIORITY-WORK.md", "memory/INDEX.md"].includes(filePath),
    )
    .slice(0, limit);
}

function detectOpenFirstFiles(claudeRoot, explicitFiles = [], limit = DEFAULT_OPEN_FIRST_LIMIT) {
  return uniqueList([
    "memory/current-context.json",
    "PRIORITY-WORK.md",
    ...explicitFiles,
    "memory/INDEX.md",
  ]).slice(0, limit);
}

function normalizeThresholds(raw = {}, options = {}) {
  const warn = clampNumber(
    raw.contextWarnPercent ?? raw.warnAt ?? options.contextWarnPercent,
    { fallback: DEFAULT_CONTEXT_WARN_PERCENT },
  );
  const save = clampNumber(
    raw.contextSavePercent ?? raw.saveAt ?? raw.checkpointAt ?? options.contextSavePercent,
    { fallback: DEFAULT_CONTEXT_SAVE_PERCENT },
  );
  const close = clampNumber(
    raw.contextClosePercent ?? raw.closeAt ?? options.contextClosePercent,
    { fallback: DEFAULT_CONTEXT_CLOSE_PERCENT },
  );

  return {
    warn,
    save: Math.max(save, warn),
    close: Math.max(close, Math.max(save, warn)),
  };
}

function buildContextWindow(raw = {}, options = {}) {
  const thresholds = normalizeThresholds(raw, options);
  const usagePercent = clampNumber(raw.contextUsage ?? raw.usagePercent, { fallback: null });
  const remainingPercent = usagePercent === null ? null : Math.max(0, 100 - usagePercent);

  let pressure = "unknown";
  let recommendedAction = "continue";
  let closeRecommended = false;

  if (usagePercent !== null) {
    if (usagePercent >= thresholds.close) {
      pressure = "critical";
      recommendedAction = "save-and-stop";
      closeRecommended = true;
    } else if (usagePercent >= thresholds.save) {
      pressure = "high";
      recommendedAction = "save-now";
    } else if (usagePercent >= thresholds.warn) {
      pressure = "watch";
      recommendedAction = "reduce-context-growth";
    } else {
      pressure = "normal";
    }
  }

  return {
    usagePercent,
    remainingPercent,
    thresholds,
    pressure,
    recommendedAction,
    closeRecommended,
    policy: `Warn at ${thresholds.warn}% used, checkpoint at ${thresholds.save}% used, stop at ${thresholds.close}% used.`,
  };
}

function hydratePayload(data = {}) {
  const resumeBrief = data.resumeBrief || {};
  const session = data.session || {};
  const commandsToReuse = uniqueList([
    ...(Array.isArray(resumeBrief.commandsToReuse) ? resumeBrief.commandsToReuse : []),
    ...(Array.isArray(session.importantCommands) ? session.importantCommands : []),
  ]).slice(0, 5);
  const openFirst = Array.isArray(resumeBrief.openFirst) && resumeBrief.openFirst.length > 0
    ? resumeBrief.openFirst
    : ["memory/current-context.json", "PRIORITY-WORK.md", "memory/INDEX.md"];
  const suggestedFiles = Array.isArray(resumeBrief.suggestedFiles) ? resumeBrief.suggestedFiles : [];
  const contextWindow =
    session.contextWindow ||
    buildContextWindow(
      {
        contextUsage: resumeBrief.contextUsage,
        warnAt: resumeBrief.checkpointPolicy?.warnAtPercent,
        saveAt: resumeBrief.checkpointPolicy?.saveAtPercent,
        closeAt: resumeBrief.checkpointPolicy?.closeAtPercent,
      },
      {},
    );

  return {
    version: data.version || 1,
    updatedAt: data.updatedAt || new Date().toISOString(),
    claudeRoot: data.claudeRoot || ".claude",
    resumeBrief: {
      instruction:
        resumeBrief.instruction ||
        "Use this file as the source of truth for session restore. Only open the listed files first.",
      currentState: resumeBrief.currentState || "Resume from the saved next action.",
      nextAction: resumeBrief.nextAction || "Open PRIORITY-WORK.md and continue.",
      blockers: Array.isArray(resumeBrief.blockers) ? resumeBrief.blockers : [],
      openFirst,
      suggestedFiles,
      commandsToReuse,
      avoidReading: Array.isArray(resumeBrief.avoidReading) ? resumeBrief.avoidReading : AVOID_READING,
      checkpointPolicy:
        resumeBrief.checkpointPolicy ||
        {
          warnAtPercent: contextWindow.thresholds.warn,
          saveAtPercent: contextWindow.thresholds.save,
          closeAtPercent: contextWindow.thresholds.close,
          closeAction: "If usage reaches the stop threshold, save and resume in a new session.",
        },
    },
    session: {
      label: session.label || "focus-session",
      reason: session.reason || "manual-save",
      completed: Array.isArray(session.completed) ? session.completed : [],
      inProgress: Array.isArray(session.inProgress)
        ? session.inProgress
        : [resumeBrief.currentState].filter(Boolean),
      nextSteps: Array.isArray(session.nextSteps)
        ? session.nextSteps
        : [resumeBrief.nextAction].filter(Boolean),
      blockers: Array.isArray(session.blockers) ? session.blockers : [],
      mustRemember: Array.isArray(session.mustRemember) ? session.mustRemember : [],
      recentDecisions: Array.isArray(session.recentDecisions) ? session.recentDecisions : [],
      openQuestions: Array.isArray(session.openQuestions) ? session.openQuestions : [],
      importantCommands: Array.isArray(session.importantCommands) ? session.importantCommands : commandsToReuse,
      contextWindow,
    },
    projectSnapshot: {
      priorityFiles: Array.isArray(data.projectSnapshot?.priorityFiles)
        ? data.projectSnapshot.priorityFiles
        : openFirst,
      recentMemoryFiles: Array.isArray(data.projectSnapshot?.recentMemoryFiles)
        ? data.projectSnapshot.recentMemoryFiles
        : ["memory/INDEX.md", "memory/session-log.md", "memory/project-brain.md", "PRIORITY-WORK.md"],
      recentWorkspaceFiles: Array.isArray(data.projectSnapshot?.recentWorkspaceFiles)
        ? data.projectSnapshot.recentWorkspaceFiles
        : suggestedFiles,
    },
  };
}

function buildPayload(raw, claudeRoot, options = {}) {
  const explicitFiles = splitList(raw.files);
  const openFirst = detectOpenFirstFiles(claudeRoot, explicitFiles, options.openFirstLimit || DEFAULT_OPEN_FIRST_LIMIT);
  const suggestedFiles = detectSuggestedFiles(
    claudeRoot,
    explicitFiles,
    options.recentFileLimit || DEFAULT_RECENT_FILE_LIMIT,
  );
  const nextSteps = splitList(raw.next);
  const blockers = splitList(raw.blockers);
  const commandsToReuse = splitList(raw.commands).slice(0, 5);
  const mustRemember = splitList(raw.mustRemember || raw.must_remember);
  const contextWindow = buildContextWindow(raw, options);
  const currentState =
    splitList(raw.inProgress)[0] || splitList(raw.summary)[0] || "Resume from the saved next action.";
  const nextAction = nextSteps[0] || "Open PRIORITY-WORK.md and continue.";

  return hydratePayload({
    version: 2,
    updatedAt: new Date().toISOString(),
    claudeRoot,
    resumeBrief: {
      instruction: "Use this file as the source of truth for session restore. Only open the listed files first.",
      currentState,
      nextAction,
      blockers: blockers.slice(0, 3),
      openFirst,
      suggestedFiles,
      commandsToReuse,
      avoidReading: AVOID_READING,
      checkpointPolicy: {
        warnAtPercent: contextWindow.thresholds.warn,
        saveAtPercent: contextWindow.thresholds.save,
        closeAtPercent: contextWindow.thresholds.close,
        closeAction: "If usage reaches the stop threshold, save and resume in a fresh session.",
      },
    },
    session: {
      label: raw.label || "focus-session",
      reason: raw.reason || "manual-save",
      completed: splitList(raw.summary),
      inProgress: splitList(raw.inProgress),
      nextSteps,
      blockers,
      mustRemember,
      recentDecisions: splitList(raw.recentDecisions || raw.decisions),
      openQuestions: splitList(raw.openQuestions || raw.questions),
      importantCommands: commandsToReuse,
      contextWindow,
    },
    projectSnapshot: {
      priorityFiles: openFirst,
      recentMemoryFiles: [
        "memory/INDEX.md",
        "memory/session-log.md",
        "memory/project-brain.md",
        "PRIORITY-WORK.md",
      ],
      recentWorkspaceFiles: suggestedFiles,
    },
  });
}

function describeContextWindow(payload) {
  const contextWindow = payload.session.contextWindow;
  const checkpointPolicy = payload.resumeBrief.checkpointPolicy;

  if (contextWindow.usagePercent === null) {
    return `Context usage: not recorded
Policy:        warn ${checkpointPolicy.warnAtPercent}% / save ${checkpointPolicy.saveAtPercent}% / stop ${checkpointPolicy.closeAtPercent}%`;
  }

  return `Context usage: ${contextWindow.usagePercent}% used (${contextWindow.remainingPercent}% left)
Policy:        warn ${checkpointPolicy.warnAtPercent}% / save ${checkpointPolicy.saveAtPercent}% / stop ${checkpointPolicy.closeAtPercent}%
Recommended:   ${contextWindow.recommendedAction}`;
}

function renderResumeBrief(payload) {
  const hydrated = hydratePayload(payload);

  return `CONTEXT RESTORED
────────────────────────
Current state: ${hydrated.resumeBrief.currentState}
Next action:   ${hydrated.resumeBrief.nextAction}
${describeContextWindow(hydrated)}

Open first:
${formatList(hydrated.resumeBrief.openFirst, "No priority files recorded.")}

Blockers:
${formatList(hydrated.resumeBrief.blockers, "none")}

Reuse commands:
${formatList(hydrated.resumeBrief.commandsToReuse, "No command history recorded.")}`;
}

function renderMarkdown(payload) {
  const hydrated = hydratePayload(payload);
  const contextWindow = hydrated.session.contextWindow;

  return `# Session Handoff

## Resume Brief
- Current State: ${hydrated.resumeBrief.currentState}
- Next Action: ${hydrated.resumeBrief.nextAction}
- Context Pressure: ${contextWindow.usagePercent === null ? "not recorded" : `${contextWindow.usagePercent}% used / ${contextWindow.remainingPercent}% left`}
- Recommended Action: ${contextWindow.recommendedAction}

### Open First
${formatList(hydrated.resumeBrief.openFirst, "No priority files recorded.")}

### Suggested Files
${formatList(hydrated.resumeBrief.suggestedFiles, "No suggested files recorded.")}

### Avoid Reading
${formatList(hydrated.resumeBrief.avoidReading, "No avoid-reading guidance recorded.")}

### Reuse Commands
${formatList(hydrated.resumeBrief.commandsToReuse, "No command history recorded.")}

### Context Policy
- Warn at ${hydrated.resumeBrief.checkpointPolicy.warnAtPercent}% used
- Save at ${hydrated.resumeBrief.checkpointPolicy.saveAtPercent}% used
- Stop at ${hydrated.resumeBrief.checkpointPolicy.closeAtPercent}% used
- ${hydrated.resumeBrief.checkpointPolicy.closeAction}

## Session
- Label: ${hydrated.session.label}
- Saved At: ${hydrated.updatedAt}
- Reason: ${hydrated.session.reason}

## Completed
${formatList(hydrated.session.completed, "No completion summary captured.")}

## In Progress
${formatList(hydrated.session.inProgress, "No in-progress item captured.")}

## Next Steps
${nextStepsMarkdown(hydrated.session.nextSteps)}

## Must Remember
${formatList(hydrated.session.mustRemember, "No must-remember facts captured.")}

## Blockers
${formatList(hydrated.session.blockers, "none")}

## Recent Decisions
${formatList(hydrated.session.recentDecisions, "No new decisions captured.")}

## Open Questions
${formatList(hydrated.session.openQuestions, "none")}
`;
}

function renderSessionLogEntry(payload) {
  const hydrated = hydratePayload(payload);
  const date = formatDateStamp(hydrated.updatedAt);
  const contextWindow = hydrated.session.contextWindow;
  const contextLine =
    contextWindow.usagePercent === null
      ? "Context not recorded"
      : `${contextWindow.usagePercent}% used / ${contextWindow.remainingPercent}% left — ${contextWindow.recommendedAction}`;

  return `### ${date} — ${hydrated.session.label} (${hydrated.session.reason})

**Completed**:
${formatList(hydrated.session.completed, "No completion summary captured.")}

**In progress**:
${formatList(hydrated.session.inProgress, "No in-progress item captured.")}

**Context**:
- ${contextLine}

**Next session starts with**:
${hydrated.resumeBrief.nextAction}
\`${hydrated.resumeBrief.openFirst[0] || "memory/current-context.json"}\`
`;
}

function splitSessionLogEntries(text) {
  return text
    .split(/\n(?=### )/g)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function defaultSessionLog() {
  return `# Session Log — Rolling History

> Last 10 sessions, newest first.
> Written by /session-end or session guards. Read at every session start (last 3 entries).
> Format: date, what was done, current pressure, and the exact next action.

---

${SESSION_LOG_MARKER}
`;
}

function writeSessionLog(memoryDir, payload) {
  const sessionLogPath = path.join(memoryDir, "session-log.md");
  const entry = renderSessionLogEntry(payload);
  const existing = fs.existsSync(sessionLogPath)
    ? fs.readFileSync(sessionLogPath, "utf8")
    : defaultSessionLog();

  let nextContent = `${existing.trim()}\n\n${entry}\n`;

  if (existing.includes(SESSION_LOG_MARKER)) {
    const markerIndex = existing.indexOf(SESSION_LOG_MARKER);
    const beforeMarker = existing.slice(0, markerIndex);
    const afterMarker = existing.slice(markerIndex);
    const firstEntryIndex = beforeMarker.indexOf("\n### ");

    if (firstEntryIndex >= 0) {
      const header = beforeMarker.slice(0, firstEntryIndex + 1);
      const entries = splitSessionLogEntries(beforeMarker.slice(firstEntryIndex + 1).trim());
      const dedupedEntries = [entry, ...entries.filter((existingEntry) => existingEntry !== entry)].slice(0, 10);

      nextContent = `${header}${dedupedEntries.join("\n\n")}\n\n${afterMarker}`;
    } else {
      nextContent = `${beforeMarker.trim()}\n\n${entry}\n\n${afterMarker}`;
    }
  }

  fs.writeFileSync(sessionLogPath, nextContent, "utf8");
}

function replaceSection(content, heading, body) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(## ${escapedHeading}\\n\\n)([\\s\\S]*?)(?=\\n## |$)`, "m");

  if (!pattern.test(content)) {
    return `${content.trim()}\n\n## ${heading}\n\n${body.trim()}\n`;
  }

  return content.replace(pattern, `$1${body.trim()}\n`);
}

function extractBulletSection(content, heading) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`## ${escapedHeading}\\n\\n([\\s\\S]*?)(?=\\n## |$)`, "m");
  const match = content.match(pattern);

  if (!match) {
    return [];
  }

  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter((line) => line && !line.startsWith("[FILL") && line !== "none");
}

function defaultPriorityWork() {
  return `# PRIORITY WORK — Context Compaction Anchor

> This file is re-read at the start of every session and after every context compaction.
> It is the single most important file for resuming work. Keep it ruthlessly up to date.
> Rule: If this file is stale, everything else is uncertain.
> Fast path: read \`memory/current-context.json\` first, then use this file for deeper detail.
`;
}

function renderSessionLogSnippet(existingContent, payload) {
  const hydrated = hydratePayload(payload);
  const date = formatDateStamp(hydrated.updatedAt);
  const currentEntry = `[${date}] — ${hydrated.resumeBrief.currentState}. Next: ${hydrated.resumeBrief.nextAction}`;

  const existingLines = (() => {
    const match = existingContent.match(/## Session Log[\s\S]*?```([\s\S]*?)```/m);

    if (!match) {
      return [];
    }

    return match[1]
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !line.includes("[DATE]"));
  })();

  return [currentEntry, ...existingLines.filter((line) => line !== currentEntry)].slice(0, 10);
}

function writePriorityWork(claudeRoot, payload) {
  const hydrated = hydratePayload(payload);
  const priorityPath = path.join(claudeRoot, "PRIORITY-WORK.md");
  const existing = fs.existsSync(priorityPath) ? fs.readFileSync(priorityPath, "utf8") : defaultPriorityWork();
  const contextWindow = hydrated.session.contextWindow;
  const status = contextWindow.closeRecommended
    ? "checkpointed — start fresh session"
    : contextWindow.recommendedAction === "save-now"
      ? "checkpointed"
      : "in-progress";
  const completed = hydrated.session.completed;
  const mustRemember = hydrated.session.mustRemember;
  const decisions = hydrated.session.recentDecisions;
  const blockers = hydrated.session.blockers.length > 0 ? hydrated.session.blockers : ["nothing"];
  const openQuestions = hydrated.session.openQuestions.length > 0 ? hydrated.session.openQuestions : ["none"];
  const doNotTouch = extractBulletSection(existing, "Do Not Touch Until Current Task Is Done");
  const sessionLogLines = renderSessionLogSnippet(existing, hydrated);

  const nextContent = `# PRIORITY WORK — Context Compaction Anchor

> This file is re-read at the start of every session and after every context compaction.
> It is the single most important file for resuming work. Keep it ruthlessly up to date.
> Rule: If this file is stale, everything else is uncertain.
> Fast path: read \`memory/current-context.json\` first, then use this file for deeper detail.

---

## Current Priority

**Phase**: ${hydrated.session.label}
**Current task**: ${hydrated.resumeBrief.currentState}
**Status**: ${status}
**Blocked on**: ${blockers.join("; ")}
**Next immediate action**: ${hydrated.resumeBrief.nextAction}

---

## What Was Just Completed

${formatList(completed, "No completion summary captured.")}

---

## Context That Must Not Be Lost

${formatList(
  [
    ...mustRemember,
    `Context policy: warn ${hydrated.resumeBrief.checkpointPolicy.warnAtPercent}% / save ${hydrated.resumeBrief.checkpointPolicy.saveAtPercent}% / stop ${hydrated.resumeBrief.checkpointPolicy.closeAtPercent}%`,
  ],
  "No must-remember facts captured.",
)}

---

## Recent Decisions Made

${formatList(
  decisions.map((entry) => `${formatDateStamp(hydrated.updatedAt)}: ${entry}`),
  "none",
)}

---

## Do Not Touch Until Current Task Is Done

${formatList(doNotTouch, "none")}

---

## Open Questions / Blockers

${formatList(openQuestions, "none")}

---

## Session Log

\`\`\`
${sessionLogLines.join("\n")}
\`\`\`

---

> When context compaction happens, Claude re-reads this file first.
> This file is the anchor that prevents losing progress between sessions.
> Update it before ending ANY work session — even a short one.
`;

  fs.writeFileSync(priorityPath, nextContent, "utf8");
}

function renderDecisionEntry(decision, date) {
  return `### ${date} — ${decision}
**Decision**: ${decision}
**Why**: Captured automatically from the latest structured session save.
**Alternatives rejected**: Not recorded yet.
**Impact**: Review the current task, related memory files, and touched code before changing this area.
**Revisit if**: The workflow or project requirements change materially.
`;
}

function appendDecisionEntries(memoryDir, payload) {
  const hydrated = hydratePayload(payload);
  const decisionsPath = path.join(memoryDir, "decisions.md");
  const existing = fs.existsSync(decisionsPath)
    ? fs.readFileSync(decisionsPath, "utf8")
    : `# Decisions — Architecture Record

> Key decisions with reasoning. Append-only — never delete.
> Added by /session-end when significant architectural decisions are made.
> Cross-reference with ADR.md for formal records.

---

## Format

\`\`\`markdown
### [YYYY-MM-DD] — [Decision Title]
**Decision**: [What was decided]
**Why**: [Reasoning — what made this the right choice]
**Alternatives rejected**: [What else was considered and why it lost]
**Impact**: [What parts of the codebase this affects]
**Revisit if**: [Conditions under which this decision should be reconsidered]
\`\`\`

---

${DECISIONS_MARKER}
`;
  const date = formatDateStamp(hydrated.updatedAt);
  const freshEntries = hydrated.session.recentDecisions
    .filter((decision) => !existing.includes(`### ${date} — ${decision}`))
    .map((decision) => renderDecisionEntry(decision, date));

  if (freshEntries.length === 0) {
    return;
  }

  const nextContent = existing.includes(DECISIONS_MARKER)
    ? existing.replace(DECISIONS_MARKER, `${freshEntries.join("\n")}\n${DECISIONS_MARKER}`)
    : `${existing.trim()}\n\n${freshEntries.join("\n")}\n`;

  fs.writeFileSync(decisionsPath, nextContent, "utf8");
}

function renderIndex(payload) {
  const hydrated = hydratePayload(payload);

  return `# Memory Index — Always Read at Session Start

> Claude: read this file at the start of EVERY session before doing anything else.
> It points to what matters. Don't read all memory files — read what's relevant.

---

## Load Order (each session start)

1. **\`current-context.json\`** — compact resume brief
2. **\`PRIORITY-WORK.md\`** — exact current task and next action
3. **This file** (\`INDEX.md\`) — orient yourself
4. **Only the files listed in \`resumeBrief.openFirst\`**

Read \`session-log.md\`, \`project-brain.md\`, \`decisions.md\`, \`patterns.md\`, and \`errors.md\` only when relevant to the current task.

---

## Active Project State

| Field | Value |
|-------|-------|
| Last session | ${formatDateStamp(hydrated.updatedAt)} |
| Current phase | ${hydrated.session.label} |
| Last thing completed | ${escapePipes(hydrated.session.completed[0] || "Nothing recorded")} |
| Currently in progress | ${escapePipes(hydrated.session.inProgress[0] || hydrated.resumeBrief.currentState)} |
| Blocked on | ${escapePipes(hydrated.session.blockers[0] || "nothing")} |
| Next action | ${escapePipes(hydrated.resumeBrief.nextAction)} |

---

## Context Policy

- Warn at ${hydrated.resumeBrief.checkpointPolicy.warnAtPercent}% used
- Save at ${hydrated.resumeBrief.checkpointPolicy.saveAtPercent}% used
- Stop and resume fresh at ${hydrated.resumeBrief.checkpointPolicy.closeAtPercent}% used

---

## Memory Files

| File | Contents | When to read |
|------|----------|-------------|
| \`current-context.json\` | Compact machine-readable resume brief | First file every session |
| \`session-log.md\` | Rolling log of session summaries | When you need recent history |
| \`project-brain.md\` | Persistent knowledge about this specific project | When permanent facts matter |
| \`decisions.md\` | Architecture decisions + reasoning | When touching affected areas |
| \`patterns.md\` | Discovered code patterns in this codebase | When writing new code |
| \`errors.md\` | Past errors + how they were solved | When debugging |
| \`checkpoints.ndjson\` | Machine-readable save history | For tools, hooks, and wrappers |

---

## Quick Recovery Protocol

\`\`\`
1. Read memory/current-context.json
2. Read PRIORITY-WORK.md
3. Open only the listed openFirst files
4. If the last save ended at >= ${hydrated.resumeBrief.checkpointPolicy.closeAtPercent}% context used, continue in a fresh session
5. Announce: "Resuming from [state]. Next: [action]."
\`\`\`

---

> This file is the entry point to Claude's persistent memory for this project.
> It is updated automatically whenever a structured checkpoint is saved.
`;
}

function writeIndex(memoryDir, payload) {
  fs.writeFileSync(path.join(memoryDir, "INDEX.md"), renderIndex(payload), "utf8");
}

function writeCheckpointHistory(memoryDir, payload, limit = DEFAULT_CHECKPOINT_HISTORY_LIMIT) {
  const checkpointPath = path.join(memoryDir, "checkpoints.ndjson");
  const entry = JSON.stringify({
    updatedAt: payload.updatedAt,
    label: payload.session.label,
    reason: payload.session.reason,
    currentState: payload.resumeBrief.currentState,
    nextAction: payload.resumeBrief.nextAction,
    openFirst: payload.resumeBrief.openFirst,
    contextWindow: payload.session.contextWindow,
  });
  const existing = fs.existsSync(checkpointPath)
    ? fs
        .readFileSync(checkpointPath, "utf8")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    : [];
  const nextLines = [...existing.filter((line) => line !== entry), entry].slice(-limit);

  fs.writeFileSync(checkpointPath, `${nextLines.join("\n")}\n`, "utf8");
}

function writeSession(raw, options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const claudeRoot = resolveClaudeRoot(cwd, options.claudeDir);
  const memoryDir = path.join(claudeRoot, "memory");
  const jsonPath = path.join(memoryDir, "current-context.json");
  const handoffPath = path.join(memoryDir, "last-handoff.md");
  const payload = buildPayload(raw, claudeRoot, options);

  ensureDir(memoryDir);
  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), "utf8");
  fs.writeFileSync(handoffPath, renderMarkdown(payload), "utf8");
  writeSessionLog(memoryDir, payload);
  writeIndex(memoryDir, payload);
  writeCheckpointHistory(memoryDir, payload, options.checkpointHistoryLimit || DEFAULT_CHECKPOINT_HISTORY_LIMIT);
  writePriorityWork(claudeRoot, payload);
  appendDecisionEntries(memoryDir, payload);

  return {
    claudeRoot,
    jsonPath,
    handoffPath,
    data: payload,
  };
}

function loadCurrentContext(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const claudeRoot = resolveClaudeRoot(cwd, options.claudeDir);
  const jsonPath = path.join(claudeRoot, "memory", "current-context.json");
  const handoffPath = path.join(claudeRoot, "memory", "last-handoff.md");

  if (!fs.existsSync(jsonPath)) {
    return null;
  }

  return {
    claudeRoot,
    jsonPath,
    handoffPath,
    data: hydratePayload(JSON.parse(fs.readFileSync(jsonPath, "utf8"))),
  };
}

module.exports = {
  AVOID_READING,
  buildPayload,
  buildContextWindow,
  clampNumber,
  detectOpenFirstFiles,
  detectRecentFiles,
  detectSuggestedFiles,
  formatList,
  hydratePayload,
  loadCurrentContext,
  formatDateStamp,
  renderMarkdown,
  renderIndex,
  renderResumeBrief,
  writePriorityWork,
  resolveClaudeRoot,
  splitList,
  writeSession,
};
