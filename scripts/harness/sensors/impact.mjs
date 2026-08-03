#!/usr/bin/env node
/**
 * Harness sensor — `impact`.
 *
 * Reports the blast radius of a change: which projects are affected, which
 * platforms (apps) are impacted, the spread by layer, and a risk hint. Wraps
 * `nx show projects --affected`. Prints JSON to stdout.
 *
 * Usage: node scripts/harness/sensors/impact.mjs [--base=<ref>] [--head=<ref>] [--root=<dir>]
 *   No flags  → impact of the current working-tree changes vs the Nx base.
 *   --base/--head → impact of a commit range (e.g. a PR).
 */
import { existsSync, writeSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { discoverProjects } from '../project-graph.mjs';

const args = process.argv.slice(2);
const getArg = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};
const ROOT = path.resolve(getArg('root') || process.cwd());
const base = getArg('base');
const head = getArg('head');

const fail = (msg) => {
  // Sync write: process.exit() would truncate a pipe-bound report mid-flush.
  writeSync(
    1,
    JSON.stringify({ tool: 'impact', ok: false, error: msg }, null, 2) + '\n',
  );
  process.exit(1);
};

const nx = path.join(ROOT, 'node_modules', '.bin', 'nx');
if (!existsSync(nx))
  fail('nx is not installed (node_modules/.bin/nx missing).');

// 1) Affected project names from Nx (authoritative — reads real imports).
const nxArgs = ['show', 'projects', '--affected', '--json'];
if (base) nxArgs.push(`--base=${base}`);
if (head) nxArgs.push(`--head=${head}`);
const res = spawnSync(nx, nxArgs, { cwd: ROOT, encoding: 'utf8' });
if (res.status !== 0)
  fail(`nx failed: ${(res.stderr || res.stdout || '').trim().slice(0, 500)}`);

let affectedNames = [];
try {
  affectedNames = JSON.parse(res.stdout.trim() || '[]');
} catch {
  fail('Could not parse nx output as JSON.');
}

// 2) Map every project name → its layer + vertical tags (from project.json).
//    Discovery lives in ../project-graph.mjs so `doctor` can assert it still
//    finds every project — see ADR-0019 and the note in that module.
const tagsByName = Object.fromEntries(
  discoverProjects(ROOT).map((p) => [p.name, p]),
);

// 3) Classify affected projects.
const affected = affectedNames.map((name) => {
  const { layer, vertical } = tagsByName[name] || {
    layer: 'unknown',
    vertical: 'unknown',
  };
  return {
    project: name,
    layer,
    vertical,
    type: layer === 'app' ? 'app' : 'lib',
  };
});
const platformsAffected = affected
  .filter((a) => a.type === 'app')
  .map((a) => a.project);
const byLayer = affected.reduce(
  (acc, a) => ((acc[a.layer] = (acc[a.layer] || 0) + 1), acc),
  {},
);
/** Which worlds a change reaches — `core` means every vertical (ADR-0019). */
const byVertical = affected.reduce(
  (acc, a) => ((acc[a.vertical] = (acc[a.vertical] || 0) + 1), acc),
  {},
);

// 4) Risk hint: the deeper (more foundational) the affected layer, the wider and
//    more semantically central the blast radius. Platform count is a poor signal
//    here because all apps share the web build, so nearly any lib hits all three.
const FOUNDATIONAL = new Set(['shared', 'domain', 'application']);
const OUTER_LIBS = new Set(['infrastructure', 'platform', 'ui']);
let riskHint = 'low';
if (affected.some((a) => FOUNDATIONAL.has(a.layer))) riskHint = 'high';
else if (affected.some((a) => OUTER_LIBS.has(a.layer))) riskHint = 'medium';

const report = {
  tool: 'impact',
  generatedAt: new Date().toISOString(),
  ok: true,
  range: base
    ? { base, head: head || 'working-tree' }
    : 'working-tree-vs-nx-base',
  summary: {
    affectedCount: affected.length,
    platformsAffected,
    byLayer,
    byVertical,
    riskHint,
  },
  affected: affected.sort(
    (a, b) =>
      a.layer.localeCompare(b.layer) || a.project.localeCompare(b.project),
  ),
};

process.stdout.write(JSON.stringify(report, null, 2) + '\n');
// exitCode (not exit()) lets stdout drain — exit() truncates pipes at ~8 KB.
process.exitCode = 0;
