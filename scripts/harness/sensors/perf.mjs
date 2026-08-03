#!/usr/bin/env node
/**
 * Harness sensor — `perf`.
 *
 * Two signals:
 *   A) bundle — builds an app and measures output size (raw + gzip), by asset
 *      type, with the largest chunks.
 *   B) bench  — runs Vitest benchmarks (`*.bench.ts`) of the pure core and
 *      reports ops/sec, mean and noise (rme) per case.
 * Prints JSON to stdout.
 *
 * Usage: node scripts/harness/sensors/perf.mjs [--app=<name>] [--skip-build]
 *                                             [--no-bundle] [--no-bench] [--root=<dir>]
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import harnessConfig from '../../../harness.config.mjs';

const args = process.argv.slice(2);
const has = (f) => args.includes(`--${f}`);
const getArg = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};
const ROOT = path.resolve(getArg('root') || process.cwd());

/**
 * Which bundles to measure. `--app=<name>` measures exactly that one (any app,
 * lab included); otherwise the shipping apps of the real verticals, declared in
 * harness.config (ADR-0019) so a new vertical never means editing this sensor.
 */
const APPS = getArg('app')
  ? [getArg('app')]
  : (harnessConfig.perf?.apps ?? ['bison-dashboard']);
const outDirOf = (app) =>
  path.resolve(ROOT, getArg('outDir') || `dist/apps/${app}`);
const bin = (name) => path.join(ROOT, 'node_modules', '.bin', name);
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

// ---- A) bundle ------------------------------------------------------------
function measureBundle(APP) {
  if (has('no-bundle')) return { app: APP, skipped: 'disabled (--no-bundle)' };
  const OUT_DIR = outDirOf(APP);

  let built = false;
  if (!has('skip-build')) {
    const res = spawnSync(bin('nx'), ['build', APP], {
      cwd: ROOT,
      encoding: 'utf8',
      env: { ...process.env, CI: 'true' },
    });
    if (res.status !== 0) {
      return {
        app: APP,
        built: false,
        error: (res.stderr || res.stdout || '').trim().slice(0, 800),
      };
    }
    built = true;
  }

  if (!existsSync(OUT_DIR)) {
    return {
      app: APP,
      built,
      skipped: `no build output at ${rel(OUT_DIR)} (try without --skip-build)`,
    };
  }

  const files = walk(OUT_DIR);
  let totalBytes = 0;
  let gzipBytes = 0;
  const byType = {};
  const perFile = [];
  for (const f of files) {
    const buf = readFileSync(f);
    const gz = gzipSync(buf).length;
    totalBytes += buf.length;
    gzipBytes += gz;
    const ext = path.extname(f) || '(none)';
    byType[ext] = byType[ext] || { bytes: 0, gzip: 0, files: 0 };
    byType[ext].bytes += buf.length;
    byType[ext].gzip += gz;
    byType[ext].files += 1;
    perFile.push({ file: rel(f), bytes: buf.length, gzip: gz });
  }
  const largest = perFile.sort((a, b) => b.gzip - a.gzip).slice(0, 5);
  return {
    app: APP,
    built,
    outDir: rel(OUT_DIR),
    totalBytes,
    gzipBytes,
    byType,
    largest,
  };
}

// ---- B) bench -------------------------------------------------------------
function measureBench() {
  if (has('no-bench')) return { skipped: 'disabled (--no-bench)' };

  const outJson = path.join(tmpdir(), `harness-bench-${process.pid}.json`);
  const res = spawnSync(
    bin('vitest'),
    ['bench', '--run', '--outputJson', outJson],
    {
      cwd: ROOT,
      encoding: 'utf8',
      env: { ...process.env, CI: 'true' },
    },
  );

  if (!existsSync(outJson)) {
    const msg = `${res.stdout || ''}${res.stderr || ''}`;
    if (/No benchmark files found/i.test(msg)) {
      return { skipped: 'no *.bench.ts files found' };
    }
    return { error: msg.trim().slice(0, 800) };
  }

  let raw;
  try {
    raw = JSON.parse(readFileSync(outJson, 'utf8'));
  } catch {
    return { error: 'could not parse vitest bench output' };
  }

  const files = (raw.files || []).map((f) => ({
    file: rel(f.filepath),
    benchmarks: (f.groups || []).flatMap((g) =>
      (g.benchmarks || []).map((b) => ({
        name: b.name,
        hz: Math.round(b.hz),
        meanMs: Number(b.mean.toFixed(6)),
        rmePct: Number(b.rme.toFixed(2)),
        p99Ms: Number((b.p99 ?? 0).toFixed(6)),
      })),
    ),
  }));
  return { files };
}

const bundles = APPS.map((app) => measureBundle(app));
const bench = measureBench();

const report = {
  tool: 'perf',
  generatedAt: new Date().toISOString(),
  ok: !bundles.some((b) => b.error) && !bench.error,
  bundles,
  bench,
};

process.stdout.write(JSON.stringify(report, null, 2) + '\n');
// exitCode (not exit()) lets stdout drain — exit() truncates pipes at ~8 KB.
process.exitCode = report.ok ? 0 : 1;
