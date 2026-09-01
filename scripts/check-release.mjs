import { readFileSync } from 'node:fs';

/**
 * Pre-publish guard. `publint` and `attw` already check the shape of the
 * package; this checks the things that only matter at the moment of release:
 * that the version being published is the one the tag promises, and that it is
 * not already on the registry.
 *
 * Pass a tag explicitly, or let it read GITHUB_REF_NAME on a tag build.
 * Without a tag it only runs the registry check, so it is safe to run locally.
 */
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const problems = [];

const tag =
  process.argv[2] ?? (process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : '');

for (const field of ['name', 'version', 'license', 'repository']) {
  if (!pkg[field]) problems.push(`package.json is missing "${field}"`);
}

if (pkg.private) problems.push('package.json is marked private and cannot be published');

if (tag) {
  const expected = tag.replace(/^v/, '');
  if (expected !== pkg.version) {
    problems.push(`tag ${tag} does not match package.json version ${pkg.version}`);
  }
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
  const versions = Object.keys(meta.versions ?? {});
  if (versions.includes(pkg.version)) {
    problems.push(`${pkg.name}@${pkg.version} is already published and cannot be republished`);
  } else {
    console.log(`${pkg.name}: latest published is ${meta['dist-tags']?.latest ?? 'unknown'}`);
  }
} else {
  // Do not fail the release on a registry hiccup; npm publish will still refuse
  // a duplicate version on its own.
  console.warn(
    `could not reach the registry (HTTP ${response.status}); skipping the version check`,
  );
}

if (problems.length) {
  for (const problem of problems) console.error(`release check: ${problem}`);
  process.exitCode = 1;
} else {
  console.log(`release check passed for ${pkg.name}@${pkg.version}${tag ? ` (tag ${tag})` : ''}`);
}
