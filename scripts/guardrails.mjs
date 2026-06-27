#!/usr/bin/env node
/**
 * Wispal product-invariant guardrails (spec §10). These are not style lint — they are
 * the things that, if they ever appear, mean we've drifted from what Wispal IS:
 *   1. No leaderboard / user-vs-user ranking anywhere.
 *   2. No volume-based reward multiplier (consistency multipliers are fine).
 *   3. No runtime LLM/frontier-model dependency — all dialogue comes from content packs.
 *
 * Exits non-zero on any violation so it can gate CI.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const SCAN_DIRS = [
  "web/app",
  "web/features",
  "web/lib",
  "web/content",
  "extension/src",
];
const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".mjs"]);

const RULES = [
  {
    id: "no-leaderboard",
    desc: "No leaderboard / user-vs-user ranking",
    re: /leaderboard|user[\s_-]*ranking|rank[\s_-]*users|global[\s_-]*rank/i,
  },
  {
    id: "no-volume-multiplier",
    desc: "No volume-based reward multiplier (consistency multipliers are allowed)",
    re: /volume[\s_-]*multiplier|hours?[\s_-]*multiplier|minutes?[\s_-]*multiplier/i,
  },
  {
    id: "no-runtime-llm",
    desc: "No runtime LLM/frontier-model dependency",
    re: /\b(from\s+['"](openai|@anthropic-ai\/sdk|anthropic|langchain|cohere-ai|replicate|@google\/generative-ai)['"])|openai\.chat|anthropic\.messages/i,
  },
];

function walk(dir) {
  const abs = join(ROOT, dir);
  let entries;
  try {
    entries = readdirSync(abs);
  } catch {
    return [];
  }
  const files = [];
  for (const name of entries) {
    const p = join(abs, name);
    const s = statSync(p);
    if (s.isDirectory()) files.push(...walk(join(dir, name)));
    else if (CODE_EXT.has(extname(name))) files.push(p);
  }
  return files;
}

// Strip comments so explanatory prose ("there is deliberately NO volume multiplier")
// doesn't trip rules — we're enforcing what the CODE does, not what comments say.
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

const violations = [];
for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    const raw = readFileSync(file, "utf8");
    const text = extname(file) === ".json" ? raw : stripComments(raw);
    for (const rule of RULES) {
      const m = text.match(rule.re);
      if (m) {
        const line = text.slice(0, m.index).split("\n").length;
        violations.push({ rule: rule.id, desc: rule.desc, file: file.replace(ROOT + "/", ""), line, match: m[0] });
      }
    }
  }
}

if (violations.length) {
  console.error("✗ Wispal guardrail violations:\n");
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.file}:${v.line} — "${v.match}"  (${v.desc})`);
  }
  console.error(`\n${violations.length} violation(s). These are product invariants — do not bypass.`);
  process.exit(1);
}

console.log("✓ Wispal guardrails pass: no leaderboard/ranking, no volume multiplier, no runtime LLM.");
