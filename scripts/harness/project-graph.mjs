/**
 * Shared Nx project discovery for the harness.
 *
 * Extracted so `impact` and `doctor` cannot drift: doctor's job is to prove the
 * discovery still finds every project, which is only meaningful if it exercises
 * the SAME code impact relies on.
 *
 * Why it exists: discovery used to assume a project.json sat exactly one level
 * under `libs/` or `apps/`. ADR-0019 nested them (`apps/<vertical>/<app>/`,
 * `libs/verticals/<v>/<layer>/`), and the one-level scan silently returned
 * "unknown" for every app and vertical lib — which downstream reads as "no
 * impact" rather than "not found". A sensor that stops seeing is
 * indistinguishable from one that finds nothing, so the invariant is checked,
 * not assumed.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

/** The roots a project may live under. */
export const PROJECT_ROOTS = ['libs', 'apps'];

/** `layer:ui` → `ui`; missing → `unknown`. */
const tagValue = (tags, prefix) => {
  const hit = (tags || []).find((t) => t.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : 'unknown';
};

/**
 * Every Nx project under `libs/` and `apps/`, found recursively.
 * Returns `{ name, dir, layer, vertical }[]`, sorted by name.
 */
export const discoverProjects = (root, { maxDepth = 4 } = {}) => {
  const found = [];

  const walk = (dir, depth) => {
    if (depth > maxDepth || !existsSync(dir)) return;
    const manifest = path.join(dir, 'project.json');
    if (existsSync(manifest)) {
      try {
        const json = JSON.parse(readFileSync(manifest, 'utf8'));
        found.push({
          name: json.name || path.basename(dir),
          dir: path.relative(root, dir).split(path.sep).join('/'),
          layer: tagValue(json.tags, 'layer:'),
          vertical: tagValue(json.tags, 'vertical:'),
        });
        return; // projects do not nest inside projects
      } catch {
        /* malformed manifest: counted as missing by the caller's own check */
      }
    }
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === 'node_modules') continue;
      walk(path.join(dir, entry.name), depth + 1);
    }
  };

  for (const group of PROJECT_ROOTS) walk(path.join(root, group), 0);
  return found.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Ground truth for "how many projects exist", found WITHOUT the walker above —
 * so a bug in the walker cannot hide itself. Doctor compares the two.
 */
export const countProjectManifests = (root) => {
  let total = 0;
  const walk = (dir, depth) => {
    if (depth > 6 || !existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs, depth + 1);
      else if (entry.name === 'project.json') total += 1;
    }
  };
  for (const group of PROJECT_ROOTS) walk(path.join(root, group), 0);
  return total;
};
