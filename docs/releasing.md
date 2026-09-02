# Releasing

Forge Dialog publishes to npm from GitHub Actions using npm **trusted publishing** (OIDC), so no
`NPM_TOKEN` secret is stored in the repository. The workflow is `.github/workflows/release.yml`.

## One-time setup

These steps need access this repository's automation does not have. Until they are done, the release
workflow runs every check and then deliberately skips publishing.

### 1. Create and configure the `npm` environment

In **Settings → Environments**, create an environment named `npm`. The release job declares
`environment: npm`, so this is the gate that decides which workflow runs may obtain the OIDC
credential. The name must match the Environment field of the trusted publisher in step 2 exactly.

Suggested configuration:

| Setting                        | Value                                    |
| ------------------------------ | ---------------------------------------- |
| Required reviewers             | Yourself                                 |
| Wait timer                     | 0                                        |
| Allow administrators to bypass | Off                                      |
| Deployment branches and tags   | Selected: tag `v*` **and** branch `main` |

A published version cannot be replaced, so a required reviewer is the one control worth having: it
turns every publish into a deliberate click. Leaving administrator bypass on would make that gate
decorative for the person most likely to trigger a release.

Both deployment rules are needed. Releases run from a `v*` tag, but the workflow also offers
`workflow_dispatch` for a dry run from `main`; restricting the environment to tags alone would stop
that run at the gate and fail the job rather than letting it validate and skip publishing.

### 2. Configure the trusted publisher on npmjs.com

On the package's **Settings → Trusted publishers** page on npmjs.com, add a GitHub Actions
publisher with:

| Field             | Value         |
| ----------------- | ------------- |
| Organization/user | `cmm-cmm`     |
| Repository        | `ForgeDialog` |
| Workflow filename | `release.yml` |
| Environment       | `npm`         |

> npm configures trusted publishers from a package's settings page, which means the package has to
> exist first. `forgedialog` is published — 0.7.0 went out on 1 September 2026 — so that page is
> available and this can be set up now. The manual first publish described below is history for
> this package; it is kept because a fork starting from an unpublished name still needs it.

### 3. Enable publishing in the workflow

Add a repository **variable** (not a secret) in **Settings → Secrets and variables → Actions →
Variables**:

```
NPM_PUBLISH_ENABLED = true
```

The workflow checks this so that setting up the pipeline, or re-running it, cannot publish by
accident before you are ready.

## Cutting a release

1. Land the changes, each with a changeset (`npm run changeset`).
2. Apply the version bump and changelog: `npm run version-packages`, then commit the result.
3. Merge to `main`.
4. Tag the merge commit and push the tag:

   ```sh
   git tag -a v0.7.0 -m "Forge Dialog v0.7.0"
   git push origin v0.7.0
   ```

The tag push triggers the release workflow. `workflow_dispatch` runs the same job by hand, which is
useful for a dry run: with `NPM_PUBLISH_ENABLED` unset it validates everything and publishes
nothing.

## What the workflow checks before publishing

- `npm run check:release` — the tag matches `package.json` version, the package is not private, the
  required metadata is present, and that exact version is not already on the registry. Publishing a
  duplicate version fails at npm; this fails first, with a clearer message.
- `npm run validate:all` — the full gate, including the browser suite.
- A CycloneDX SBOM is generated and uploaded as a build artifact.

Provenance is attested by npm as part of trusted publishing; nothing in `package.json` needs to
request it.

## First publish without trusted publishing

Not needed here — `forgedialog` already has a published version. This is for a fork publishing a
name that has never been published, where step 2 has no settings page to configure yet:

```sh
npm run validate:all
npm run check:release
npm publish   # prompts for auth; use a granular access token scoped to this package
```

`publishConfig.access` is already `public`, so no `--access` flag is needed. Afterwards, add the
trusted publisher and set `NPM_PUBLISH_ENABLED=true` so later releases go through Actions, and
delete the token you used.

## Troubleshooting

**The publish step was skipped.** `NPM_PUBLISH_ENABLED` is not `true`. That is the default.

**`npm error code E404` on `PUT .../<package>`, with the tarball already built and listed in the
log.** This is not an auth or OIDC problem — npm returns 404 rather than 401/403 here specifically
because trusted publishing has nothing to attach to yet: the name has never been published, so
there is no package settings page to hold a trusted publisher entry. It cannot happen to
`forgedialog` any more, which has a published version; a fork hitting it should do the manual first
publish in the section above, then add the trusted publisher and set `NPM_PUBLISH_ENABLED=true`.

**`ENEEDAUTH` or an OIDC error** (distinct from the E404 above; this is for a package that already
has at least one published version). The trusted publisher entry on npmjs.com must match the
repository, workflow filename, and environment name exactly. The job also needs
`permissions: id-token: write`, which is set at the top of the workflow.

**npm rejects the version.** It is already published. Versions on npm are immutable — bump and tag
again rather than trying to overwrite.
