import fs from "node:fs";
import path from "node:path";

const CODE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const TEST_SUFFIX_RE = /\.(test|spec)$/;

function toPosix(relPath) {
  return relPath.split(path.sep).join("/");
}

function isCodeFile(relPath) {
  return CODE_EXTENSIONS.includes(path.extname(relPath));
}

function isTestFile(relPath) {
  const base = path.basename(relPath, path.extname(relPath));
  return TEST_SUFFIX_RE.test(base);
}

function readFileSafe(absPath) {
  try {
    return fs.readFileSync(absPath, "utf8");
  } catch {
    return "";
  }
}

function parseRelativeImports(sourceText) {
  const imports = new Set();
  const importRe = /(?:import|export)\s+(?:[^"'`]*?from\s+)?["'`]([^"'`]+)["'`]/g;
  let match;
  while ((match = importRe.exec(sourceText)) !== null) {
    const target = match[1];
    if (target.startsWith("./") || target.startsWith("../")) {
      imports.add(target);
    }
  }
  return [...imports];
}

function resolveRelativeImport(repoRoot, fromRelPath, importTarget) {
  const fromDir = path.dirname(fromRelPath);
  const unresolved = path.normalize(path.join(fromDir, importTarget));
  const candidates = [
    unresolved,
    ...CODE_EXTENSIONS.map((ext) => `${unresolved}${ext}`),
    ...CODE_EXTENSIONS.map((ext) => path.join(unresolved, `index${ext}`)),
  ];

  for (const relCandidate of candidates) {
    const absCandidate = path.join(repoRoot, relCandidate);
    if (fs.existsSync(absCandidate) && fs.statSync(absCandidate).isFile()) {
      return toPosix(path.relative(repoRoot, absCandidate));
    }
  }

  return null;
}

function stripKnownExt(relPath) {
  const ext = path.extname(relPath);
  if (!CODE_EXTENSIONS.includes(ext)) {
    return relPath;
  }
  return relPath.slice(0, -ext.length);
}

function testCandidatesForSource(relPath) {
  const baseNoExt = stripKnownExt(relPath);
  const relDir = path.dirname(relPath);
  const relBase = path.basename(baseNoExt);

  const sibling = CODE_EXTENSIONS.flatMap((ext) => [
    path.join(relDir, `${relBase}.test${ext}`),
    path.join(relDir, `${relBase}.spec${ext}`),
  ]);

  const repoMirror = CODE_EXTENSIONS.flatMap((ext) => [
    `tests/${baseNoExt}.test${ext}`,
    `tests/${baseNoExt}.spec${ext}`,
  ]);

  return [...sibling, ...repoMirror].map(toPosix);
}

function sourceCandidatesForTest(relPath) {
  const ext = path.extname(relPath);
  if (!CODE_EXTENSIONS.includes(ext)) {
    return [];
  }

  const base = path.basename(relPath, ext);
  const sourceBase = base.replace(TEST_SUFFIX_RE, "");
  if (sourceBase === base) {
    return [];
  }

  const relDir = path.dirname(relPath);
  const direct = path.join(relDir, `${sourceBase}${ext}`);

  let mirror = null;
  if (toPosix(relPath).startsWith("tests/")) {
    const noTestsPrefix = relPath.replace(/^tests\//, "");
    const mirrorBase = noTestsPrefix
      .slice(0, -ext.length)
      .replace(/\.(test|spec)$/, "");
    mirror = `${mirrorBase}${ext}`;
  }

  return [direct, mirror].filter(Boolean).map(toPosix);
}

export function resolveImpactedFiles({ repoRoot, stagedFiles }) {
  const stagedPosix = [...new Set(stagedFiles.map(toPosix))];
  const impacted = new Set(stagedPosix);

  for (const relPath of stagedPosix) {
    const abs = path.join(repoRoot, relPath);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      continue;
    }

    if (isCodeFile(relPath)) {
      const source = readFileSafe(abs);
      const relativeImports = parseRelativeImports(source);
      for (const importTarget of relativeImports) {
        const resolved = resolveRelativeImport(repoRoot, relPath, importTarget);
        if (resolved) {
          impacted.add(resolved);
        }
      }
    }

    if (isTestFile(relPath)) {
      for (const sourceCandidate of sourceCandidatesForTest(relPath)) {
        const absCandidate = path.join(repoRoot, sourceCandidate);
        if (fs.existsSync(absCandidate) && fs.statSync(absCandidate).isFile()) {
          impacted.add(sourceCandidate);
        }
      }
    } else {
      for (const testCandidate of testCandidatesForSource(relPath)) {
        const absCandidate = path.join(repoRoot, testCandidate);
        if (fs.existsSync(absCandidate) && fs.statSync(absCandidate).isFile()) {
          impacted.add(testCandidate);
        }
      }
    }
  }

  return [...impacted];
}
