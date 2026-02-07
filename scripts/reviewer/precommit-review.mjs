#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { resolveImpactedFiles } from "./neighbor-resolver.mjs";

const RELEVANT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".sql",
  ".md",
  ".json",
  ".yaml",
  ".yml",
]);

const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const TEST_FILE_RE = /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/;

function run(cmd, args, cwd, options = {}) {
  const { timeoutMs } = options;
  const result = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 10 * 1024 * 1024,
    timeout: timeoutMs,
  });

  return {
    code: result.status ?? 1,
    stdout: result.stdout?.trim() ?? "",
    stderr: result.stderr?.trim() ?? "",
    timedOut: Boolean(result.error && result.error.code === "ETIMEDOUT"),
  };
}

function git(args, repoRoot) {
  return run("git", args, repoRoot);
}

function nowIsoCompact() {
  return new Date().toISOString().replace(/[.:]/g, "-");
}

function normalizePath(relPath) {
  return relPath.split(path.sep).join("/");
}

function toAbsGitDir(repoRoot, gitDirRaw) {
  if (!gitDirRaw) {
    return path.join(repoRoot, ".git");
  }

  return path.isAbsolute(gitDirRaw) ? gitDirRaw : path.join(repoRoot, gitDirRaw);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function toGlobRegex(pattern) {
  const normalized = normalizePath(pattern);
  const escaped = normalized.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const withGlobstar = escaped.replace(/\*\*/g, "__GLOBSTAR__");
  const withSingleStar = withGlobstar.replace(/\*/g, "[^/]*");
  const withQuestion = withSingleStar.replace(/\?/g, "[^/]");
  const finalPattern = withQuestion.replace(/__GLOBSTAR__/g, ".*");
  return new RegExp(`^${finalPattern}$`);
}

function matchesAnyPattern(relPath, patterns) {
  const target = normalizePath(relPath);
  return patterns.some((pattern) => toGlobRegex(pattern).test(target));
}

function safeStatSize(absPath) {
  try {
    const stat = fs.statSync(absPath);
    return stat.isFile() ? stat.size : 0;
  } catch {
    return 0;
  }
}

function isCodeFile(relPath) {
  return CODE_EXTENSIONS.has(path.extname(relPath));
}

function isTestFile(relPath) {
  return TEST_FILE_RE.test(normalizePath(relPath));
}

function stripCodeExtension(relPath) {
  const ext = path.extname(relPath);
  if (!CODE_EXTENSIONS.has(ext)) {
    return relPath;
  }
  return relPath.slice(0, -ext.length);
}

function sourceHasStagedTest(sourceRelPath, stagedSet) {
  const ext = path.extname(sourceRelPath);
  if (!CODE_EXTENSIONS.has(ext)) {
    return false;
  }

  const sourceNoExt = stripCodeExtension(sourceRelPath);
  const relDir = path.dirname(sourceNoExt);
  const relBase = path.basename(sourceNoExt);

  const candidates = [
    path.join(relDir, `${relBase}.test${ext}`),
    path.join(relDir, `${relBase}.spec${ext}`),
    `tests/${sourceNoExt}.test${ext}`,
    `tests/${sourceNoExt}.spec${ext}`,
  ].map(normalizePath);

  return candidates.some((candidate) => stagedSet.has(candidate));
}

function chooseReviewFiles({ repoRoot, stagedFiles, impactedFiles, limits }) {
  const staged = [...new Set(stagedFiles.map(normalizePath))];
  const impacted = [...new Set(impactedFiles.map(normalizePath))];

  const selected = [];
  const selectedSet = new Set();
  let totalBytes = 0;

  const addFile = (relPath) => {
    if (selectedSet.has(relPath)) {
      return;
    }

    const absPath = path.join(repoRoot, relPath);
    if (!fs.existsSync(absPath)) {
      return;
    }

    const size = safeStatSize(absPath);

    if (!staged.includes(relPath)) {
      if (selected.length >= limits.maxFiles) {
        return;
      }
      if (totalBytes + size > limits.maxBytes) {
        return;
      }
    }

    selected.push(relPath);
    selectedSet.add(relPath);
    totalBytes += size;
  };

  for (const relPath of staged) {
    addFile(relPath);
  }

  for (const relPath of impacted) {
    if (staged.includes(relPath)) {
      continue;
    }
    addFile(relPath);
  }

  const excluded = impacted.filter((relPath) => !selectedSet.has(relPath));

  return {
    selectedFiles: selected,
    stagedFiles: staged,
    totalBytes,
    truncated: excluded.length > 0,
    excludedFiles: excluded,
  };
}

function parseNumstat(diffNumstat) {
  if (!diffNumstat) {
    return 0;
  }

  return diffNumstat
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((sum, line) => {
      const parts = line.split(/\s+/);
      const added = Number(parts[0]);
      const removed = Number(parts[1]);
      return sum + (Number.isFinite(added) ? added : 0) + (Number.isFinite(removed) ? removed : 0);
    }, 0);
}

function selectReviewers({ config, stagedFiles, selectedFiles, totalChangedLines }) {
  const chosen = new Set(config.always ?? []);

  for (const conditional of config.conditional ?? []) {
    if (matchesAnyPatternInFiles(selectedFiles, conditional.patterns ?? [])) {
      chosen.add(conditional.reviewer);
    }
  }

  const stagedSet = new Set(stagedFiles.map(normalizePath));
  const stagedCode = stagedFiles.filter((file) => isCodeFile(file) && !isTestFile(file));
  const hasExplicitTestTouch = matchesAnyPatternInFiles(selectedFiles, config.testing?.patterns ?? []);
  const hasCodeWithoutUpdatedTests = stagedCode.some((sourceFile) => !sourceHasStagedTest(sourceFile, stagedSet));

  if (
    hasExplicitTestTouch ||
    (config.testing?.enforceForCodeWithoutTests && stagedCode.length > 0 && hasCodeWithoutUpdatedTests)
  ) {
    chosen.add(config.testing?.reviewer);
  }

  const minChangedFiles = config.simplifier?.minChangedFiles ?? Number.MAX_SAFE_INTEGER;
  const minTotalChangedLines = config.simplifier?.minTotalChangedLines ?? Number.MAX_SAFE_INTEGER;
  if (stagedFiles.length >= minChangedFiles || totalChangedLines >= minTotalChangedLines) {
    chosen.add(config.simplifier?.reviewer);
  }

  return [...chosen].filter(Boolean);
}

function matchesAnyPatternInFiles(files, patterns) {
  if (!patterns || patterns.length === 0) {
    return false;
  }

  return files.some((file) => matchesAnyPattern(file, patterns));
}

function buildPrompt({ reviewers, stagedFiles, selectedFiles, truncated, excludedFiles, repoRoot }) {
  const promptPath = path.join(repoRoot, "docs/reviewer-system/prompts");
  const findingContract = path.join(repoRoot, "docs/reviewer-system/templates/finding-schema.md");
  const reportContract = path.join(repoRoot, "docs/reviewer-system/templates/report-template.md");

  return `You are running a local pre-commit multi-agent review gate for this repository.

Use the $precommit-multi-review skill if available.
Use these repository contracts as source of truth:
- Prompt pack: ${promptPath}
- Finding contract: ${findingContract}
- Report contract: ${reportContract}

Task:
1. Review only these selected files (staged + neighbors):\n${selectedFiles.map((file) => `- ${file}`).join("\n")}
2. Consider staged files as highest priority:\n${stagedFiles.map((file) => `- ${file}`).join("\n")}
3. Evaluate with these specialists: ${reviewers.join(", ")}.
4. Perform orchestrator-style dedupe and severity calibration.
5. Return findings only for issues that are plausible, actionable, and scoped to the selected files.

Context limits:
- Selection truncated: ${truncated ? "yes" : "no"}
${truncated ? `- Excluded neighbors due to cap:\n${excludedFiles.map((file) => `  - ${file}`).join("\n")}` : ""}

Output requirements:
- Return STRICT JSON only (no prose, no markdown, no code fences).
- JSON shape:
{
  "overallSummary": "string",
  "findings": [
    {
      "id": "string",
      "title": "string",
      "severity": "low|medium|high|critical",
      "confidence": "low|medium|high",
      "status": "open|resolved|deferred",
      "reviewer": "string",
      "file": "repo/relative/path",
      "summary": "string",
      "recommendation": "string"
    }
  ]
}
- If there are no findings, return findings as an empty array.
`;
}

function parseJsonLoose(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    // continue
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // continue
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }

  return null;
}

function normalizeSeverity(value) {
  const v = String(value || "").toLowerCase();
  return ["low", "medium", "high", "critical"].includes(v) ? v : "low";
}

function normalizeConfidence(value) {
  const v = String(value || "").toLowerCase();
  return ["low", "medium", "high"].includes(v) ? v : "low";
}

function normalizeStatus(value) {
  const v = String(value || "").toLowerCase();
  return ["open", "resolved", "deferred"].includes(v) ? v : "open";
}

function normalizeFindings(rawFindings) {
  if (!Array.isArray(rawFindings)) {
    return [];
  }

  return rawFindings.map((finding, idx) => ({
    id: String(finding?.id || `F-${idx + 1}`),
    title: String(finding?.title || "Untitled finding"),
    severity: normalizeSeverity(finding?.severity),
    confidence: normalizeConfidence(finding?.confidence),
    status: normalizeStatus(finding?.status),
    reviewer: String(finding?.reviewer || "00-orchestrator"),
    file: String(finding?.file || "(unspecified)"),
    summary: String(finding?.summary || ""),
    recommendation: String(finding?.recommendation || ""),
  }));
}

function renderMarkdownReport({
  repoRoot,
  reviewers,
  stagedFiles,
  selectedFiles,
  truncated,
  excludedFiles,
  findings,
  overallSummary,
  commandStatus,
  startedAt,
  finishedAt,
}) {
  const blocking = findings.filter(
    (finding) =>
      finding.status !== "resolved" &&
      ["high", "critical"].includes(finding.severity) &&
      finding.confidence === "high",
  );

  const lines = [];
  lines.push("# Local Pre-Commit Multi-Agent Review");
  lines.push("");
  lines.push(`- Started: ${startedAt}`);
  lines.push(`- Finished: ${finishedAt}`);
  lines.push(`- Repo: ${repoRoot}`);
  lines.push(`- Result: ${commandStatus}`);
  lines.push("");

  lines.push("## Scope");
  lines.push("");
  lines.push("### Staged files");
  for (const file of stagedFiles) {
    lines.push(`- ${file}`);
  }

  lines.push("");
  lines.push("### Reviewed files (staged + neighbors)");
  for (const file of selectedFiles) {
    lines.push(`- ${file}`);
  }

  if (truncated) {
    lines.push("");
    lines.push("### Truncation");
    lines.push("- Selection exceeded limits; neighbor set truncated.");
    for (const file of excludedFiles) {
      lines.push(`- Excluded: ${file}`);
    }
  }

  lines.push("");
  lines.push("## Specialists");
  for (const reviewer of reviewers) {
    lines.push(`- ${reviewer}`);
  }

  lines.push("");
  lines.push("## Findings");
  if (findings.length === 0) {
    lines.push("- No findings reported.");
  } else {
    for (const finding of findings) {
      lines.push(`- [${finding.id}] ${finding.title}`);
      lines.push(`  - Severity: ${finding.severity}`);
      lines.push(`  - Confidence: ${finding.confidence}`);
      lines.push(`  - Status: ${finding.status}`);
      lines.push(`  - Reviewer: ${finding.reviewer}`);
      lines.push(`  - File: ${finding.file}`);
      if (finding.summary) {
        lines.push(`  - Summary: ${finding.summary}`);
      }
      if (finding.recommendation) {
        lines.push(`  - Recommendation: ${finding.recommendation}`);
      }
    }
  }

  lines.push("");
  lines.push("## Decision");
  if (blocking.length > 0) {
    lines.push("- Commit blocked by policy (high/critical severity + high confidence + unresolved).");
    for (const finding of blocking) {
      lines.push(`- Blocking: [${finding.id}] ${finding.title} (${finding.severity}/${finding.confidence})`);
    }
  } else {
    lines.push("- No blocking policy findings.");
  }

  lines.push("");
  lines.push("## Summary");
  lines.push(`- ${overallSummary || "No additional summary provided."}`);

  return `${lines.join("\n")}\n`;
}

function renderSummaryText({ commandStatus, findings, blockingFindings, reportPath }) {
  const parts = [
    `result=${commandStatus}`,
    `findings=${findings.length}`,
    `blocking=${blockingFindings.length}`,
    `report=${reportPath}`,
  ];
  return `${parts.join(" ")}\n`;
}

function writeArtifacts({ artifactDir, timestamp, findingsPayload, reportMd, summaryText }) {
  const findingsPath = path.join(artifactDir, `findings-${timestamp}.json`);
  const reportPath = path.join(artifactDir, `review-${timestamp}.md`);
  const summaryPath = path.join(artifactDir, `summary-${timestamp}.txt`);

  fs.writeFileSync(findingsPath, `${JSON.stringify(findingsPayload, null, 2)}\n`, "utf8");
  fs.writeFileSync(reportPath, reportMd, "utf8");
  fs.writeFileSync(summaryPath, summaryText, "utf8");

  return { findingsPath, reportPath, summaryPath };
}

function main() {
  const startedAt = new Date().toISOString();

  const repoResult = git(["rev-parse", "--show-toplevel"], process.cwd());
  if (repoResult.code !== 0 || !repoResult.stdout) {
    console.error("[ai-review] unable to determine git repo root.");
    return 1;
  }

  const repoRoot = repoResult.stdout;

  const gitDirResult = git(["rev-parse", "--git-dir"], repoRoot);
  const absGitDir = toAbsGitDir(repoRoot, gitDirResult.stdout);

  const artifactDir = path.join(absGitDir, "codex", "precommit");
  fs.mkdirSync(artifactDir, { recursive: true });

  const stagedResult = git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"], repoRoot);
  if (stagedResult.code !== 0) {
    console.error("[ai-review] failed to load staged files.");
    return 1;
  }

  const stagedFiles = stagedResult.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(normalizePath)
    .filter((file) => {
      const ext = path.extname(file);
      return RELEVANT_EXTENSIONS.has(ext) || file.startsWith("app/") || file.startsWith("docs/") || file.startsWith("lib/");
    });

  if (stagedFiles.length === 0) {
    console.log("[ai-review] no relevant staged files for review.");
    return 0;
  }

  const configPath = path.join(repoRoot, "scripts", "reviewer", "reviewer-selection.json");
  let selectionConfig;
  try {
    selectionConfig = readJson(configPath);
  } catch (error) {
    console.error(`[ai-review] failed to read selection config: ${error.message}`);
    return 1;
  }

  const impactedFiles = resolveImpactedFiles({ repoRoot, stagedFiles });

  const limits = {
    maxFiles: selectionConfig.maxFiles ?? 40,
    maxBytes: selectionConfig.maxBytes ?? 400000,
  };

  const choice = chooseReviewFiles({
    repoRoot,
    stagedFiles,
    impactedFiles,
    limits,
  });

  const numstatResult = git(["diff", "--cached", "--numstat"], repoRoot);
  const totalChangedLines = parseNumstat(numstatResult.stdout);

  const reviewers = selectReviewers({
    config: selectionConfig,
    stagedFiles: choice.stagedFiles,
    selectedFiles: choice.selectedFiles,
    totalChangedLines,
  });

  const codexCheck = run("codex", ["--version"], repoRoot);
  if (codexCheck.code !== 0) {
    const timestamp = nowIsoCompact();
    const findingsPayload = {
      overallSummary: "Codex CLI unavailable; pre-commit review skipped with warning.",
      findings: [],
      metadata: {
        reviewers,
        stagedFiles: choice.stagedFiles,
        selectedFiles: choice.selectedFiles,
        truncated: choice.truncated,
        excludedFiles: choice.excludedFiles,
      },
    };

    const reportMd = renderMarkdownReport({
      repoRoot,
      reviewers,
      stagedFiles: choice.stagedFiles,
      selectedFiles: choice.selectedFiles,
      truncated: choice.truncated,
      excludedFiles: choice.excludedFiles,
      findings: [],
      overallSummary: findingsPayload.overallSummary,
      commandStatus: "warning",
      startedAt,
      finishedAt: new Date().toISOString(),
    });

    const summaryText = renderSummaryText({
      commandStatus: "warning",
      findings: [],
      blockingFindings: [],
      reportPath: path.join(artifactDir, `review-${timestamp}.md`),
    });

    const artifacts = writeArtifacts({
      artifactDir,
      timestamp,
      findingsPayload,
      reportMd,
      summaryText,
    });

    console.error("[ai-review] codex CLI unavailable; allowing commit with warning.");
    console.error(`[ai-review] report: ${artifacts.reportPath}`);
    return 1;
  }

  const prompt = buildPrompt({
    reviewers,
    stagedFiles: choice.stagedFiles,
    selectedFiles: choice.selectedFiles,
    truncated: choice.truncated,
    excludedFiles: choice.excludedFiles,
    repoRoot,
  });

  const lastMessagePath = path.join(os.tmpdir(), `codex-precommit-${Date.now()}.txt`);
  const codexRun = run(
    "codex",
    [
      "-a",
      "never",
      "-s",
      "read-only",
      "exec",
      "--output-last-message",
      lastMessagePath,
      prompt,
    ],
    repoRoot,
    { timeoutMs: 120000 },
  );

  if (codexRun.code !== 0) {
    const timestamp = nowIsoCompact();
    const findingsPayload = {
      overallSummary: "Codex execution failed; pre-commit review skipped with warning.",
      findings: [],
      metadata: {
        reviewers,
        stagedFiles: choice.stagedFiles,
        selectedFiles: choice.selectedFiles,
        truncated: choice.truncated,
        excludedFiles: choice.excludedFiles,
        codexStderr: codexRun.stderr,
        timedOut: codexRun.timedOut,
      },
    };

    const reportMd = renderMarkdownReport({
      repoRoot,
      reviewers,
      stagedFiles: choice.stagedFiles,
      selectedFiles: choice.selectedFiles,
      truncated: choice.truncated,
      excludedFiles: choice.excludedFiles,
      findings: [],
      overallSummary: findingsPayload.overallSummary,
      commandStatus: "warning",
      startedAt,
      finishedAt: new Date().toISOString(),
    });

    const summaryText = renderSummaryText({
      commandStatus: "warning",
      findings: [],
      blockingFindings: [],
      reportPath: path.join(artifactDir, `review-${timestamp}.md`),
    });

    const artifacts = writeArtifacts({
      artifactDir,
      timestamp,
      findingsPayload,
      reportMd,
      summaryText,
    });

    console.error("[ai-review] codex execution failed; allowing commit with warning.");
    console.error(`[ai-review] report: ${artifacts.reportPath}`);
    return 1;
  }

  let lastMessage = "";
  try {
    lastMessage = fs.readFileSync(lastMessagePath, "utf8");
  } catch {
    lastMessage = codexRun.stdout;
  }

  const parsed = parseJsonLoose(lastMessage);
  if (!parsed || typeof parsed !== "object") {
    const timestamp = nowIsoCompact();
    const findingsPayload = {
      overallSummary: "Codex returned non-JSON output; pre-commit review skipped with warning.",
      findings: [],
      metadata: {
        reviewers,
        stagedFiles: choice.stagedFiles,
        selectedFiles: choice.selectedFiles,
        truncated: choice.truncated,
        excludedFiles: choice.excludedFiles,
        codexStdout: codexRun.stdout,
      },
    };

    const reportMd = renderMarkdownReport({
      repoRoot,
      reviewers,
      stagedFiles: choice.stagedFiles,
      selectedFiles: choice.selectedFiles,
      truncated: choice.truncated,
      excludedFiles: choice.excludedFiles,
      findings: [],
      overallSummary: findingsPayload.overallSummary,
      commandStatus: "warning",
      startedAt,
      finishedAt: new Date().toISOString(),
    });

    const summaryText = renderSummaryText({
      commandStatus: "warning",
      findings: [],
      blockingFindings: [],
      reportPath: path.join(artifactDir, `review-${timestamp}.md`),
    });

    const artifacts = writeArtifacts({
      artifactDir,
      timestamp,
      findingsPayload,
      reportMd,
      summaryText,
    });

    console.error("[ai-review] codex output could not be parsed; allowing commit with warning.");
    console.error(`[ai-review] report: ${artifacts.reportPath}`);
    return 1;
  }

  const findings = normalizeFindings(parsed.findings);
  const overallSummary = String(parsed.overallSummary || "Review completed.");
  const blockingFindings = findings.filter(
    (finding) =>
      finding.status !== "resolved" &&
      finding.confidence === "high" &&
      ["high", "critical"].includes(finding.severity),
  );

  const commandStatus = blockingFindings.length > 0 ? "blocked" : "pass";
  const timestamp = nowIsoCompact();

  const findingsPayload = {
    overallSummary,
    findings,
    metadata: {
      reviewers,
      stagedFiles: choice.stagedFiles,
      selectedFiles: choice.selectedFiles,
      truncated: choice.truncated,
      excludedFiles: choice.excludedFiles,
      totalChangedLines,
      policy: {
        blockWhen: "severity in {critical,high} AND confidence=high AND status!=resolved",
      },
    },
  };

  const reportMd = renderMarkdownReport({
    repoRoot,
    reviewers,
    stagedFiles: choice.stagedFiles,
    selectedFiles: choice.selectedFiles,
    truncated: choice.truncated,
    excludedFiles: choice.excludedFiles,
    findings,
    overallSummary,
    commandStatus,
    startedAt,
    finishedAt: new Date().toISOString(),
  });

  const previewReportPath = path.join(artifactDir, `review-${timestamp}.md`);
  const summaryText = renderSummaryText({
    commandStatus,
    findings,
    blockingFindings,
    reportPath: previewReportPath,
  });

  const artifacts = writeArtifacts({
    artifactDir,
    timestamp,
    findingsPayload,
    reportMd,
    summaryText,
  });

  if (commandStatus === "blocked") {
    console.error("[ai-review] blocking findings detected.");
    console.error(`[ai-review] report: ${artifacts.reportPath}`);
    for (const finding of blockingFindings) {
      console.error(
        `[ai-review] BLOCK: [${finding.id}] ${finding.title} (${finding.severity}/${finding.confidence}) ${finding.file}`,
      );
    }
    return 2;
  }

  console.log("[ai-review] no blocking policy findings.");
  console.log(`[ai-review] report: ${artifacts.reportPath}`);
  return 0;
}

const code = main();
process.exit(code);
