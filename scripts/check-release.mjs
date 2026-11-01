import { readFileSync } from 'node:fs';

/**
 * Pre-publish guard. `publint` and `attw` already check the shape of each
 * package; this checks the things that only matter at the moment of release:
 * that the version being published is the one the tag promises, that it is not
 * already on the registry, and that the wrapper packages ask for a core that
 * the release actually satisfies.
 *
 * It covers every package the release publishes — the core and the workspaces
 * under `packages/` — because a release that publishes three things and checks
 * one is a release that can half-succeed.
 *
 * Pass a tag explicitly, or let it read GITHUB_REF_NAME on a tag build.
 * Without a tag it only runs the registry check, so it is safe to run locally.
 */
const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

const root = read('../package.json');
const workspaces = root.workspaces.map((pattern) => pattern.replace('/*', ''));
const packages = [
  { dir: '.', pkg: root },
  ...workspaces.flatMap((dir) =>
    ['react', 'vue'].map((name) => ({
      dir: `${dir}/${name}`,
      pkg: read(`../${dir}/${name}/package.json`),
    })),
  ),
];

const problems = [];

const tag =
  process.argv[2] ?? (process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : '');

for (const { dir, pkg } of packages) {
  const where = dir === '.' ? 'package.json' : `${dir}/package.json`;

  for (const field of ['name', 'version', 'license', 'repository']) {
    if (!pkg[field]) problems.push(`${where} is missing "${field}"`);
  }
  if (pkg.private) problems.push(`${where} is marked private and cannot be published`);

  // The tag names the core's version. The wrapper packages carry their own, so
  // the tag says nothing about them and is not checked against them.
  if (tag && dir === '.') {
    const expected = tag.replace(/^v/, '');
    if (expected !== pkg.version) {
      problems.push(`tag ${tag} does not match ${where} version ${pkg.version}`);
    }
  }

  // A wrapper that asks for a core range the release does not satisfy would
  // install a different core than the one it was tested against.
  const wanted = pkg.dependencies?.[root.name];
  if (wanted && !satisfies(root.version, wanted)) {
    problems.push(
      `${where} depends on ${root.name}@${wanted}, which this release (${root.version}) does not satisfy`,
    );
  }

  // A version already on the registry is immutable, so publishing would fail
  // halfway through the release rather than here.
  const response = await fetch(`https://registry.npmjs.org/${pkg.name}`, {
    headers: { accept: 'application/json' },
  });

  if (response.status === 404) {
    console.log(`${pkg.name} is not published yet; ${pkg.version} would be the first release`);
  } else if (response.ok) {
    const meta = await response.json();
    if (Object.keys(meta.versions ?? {}).includes(pkg.version)) {
      problems.push(`${pkg.name}@${pkg.version} is already published and cannot be republished`);
    } else {
      console.log(`${pkg.name}: latest published is ${meta['dist-tags']?.latest ?? 'unknown'}`);
    }
  } else {
    // Do not fail the release on a registry hiccup; npm publish will still
    // refuse a duplicate version on its own.
    console.warn(
      `could not reach the registry for ${pkg.name} (HTTP ${response.status}); skipping the version check`,
    );
  }
}

/**
 * Enough of semver for the ranges this repository writes: a comma-free list of
 * space-separated comparators, all of which must hold. Deliberately not a
 * dependency — the release check should not need one to run.
 */
function satisfies(version, range) {
  const actual = version.split('.').map(Number);
  const compare = (other) => {
    const parts = other.split('.').map(Number);
    for (let i = 0; i < 3; i += 1) {
      if ((actual[i] ?? 0) !== (parts[i] ?? 0)) return (actual[i] ?? 0) - (parts[i] ?? 0);
    }
    return 0;
  };
  return range
    .trim()
    .split(/\s+/)
    .every((comparator) => {
      const [, operator, target] = comparator.match(/^([<>=^~]*)(.+)$/);
      switch (operator) {
        case '>=':
          return compare(target) >= 0;
        case '>':
          return compare(target) > 0;
        case '<=':
          return compare(target) <= 0;
        case '<':
          return compare(target) < 0;
        case '':
        case '=':
          return compare(target) === 0;
        default:
          // A caret or tilde range is not written here on purpose, because on a
          // 0.x core it pins the minor and would exclude the release it ships
          // beside. Refuse rather than guess at its meaning.
          throw new Error(`check-release does not understand the range "${range}"`);
      }
    });
}

if (problems.length) {
  for (const problem of problems) console.error(`release check: ${problem}`);
  process.exitCode = 1;
} else {
  const names = packages.map(({ pkg }) => `${pkg.name}@${pkg.version}`).join(', ');
  console.log(`release check passed for ${names}${tag ? ` (tag ${tag})` : ''}`);
}
