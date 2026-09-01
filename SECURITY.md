# Security Policy

## Supported versions

ForgeDialog is pre-1.0. Fixes land on the most recent minor line; older `0.x` lines are not
patched.

| Version | Supported |
| ------- | --------- |
| 0.7.x   | Yes       |
| < 0.7   | No        |

## Reporting a vulnerability

Please report privately rather than opening a public issue.

Use GitHub's private vulnerability reporting: go to the repository's **Security** tab and choose
**Report a vulnerability**. That opens a draft advisory visible only to you and the maintainers.

Helpful things to include: the affected version and entry point, a minimal reproduction, the impact
you believe it has, and any suggested fix.

Expect an acknowledgement within a few days. You will be kept updated while a fix is prepared, and
credited in the advisory unless you prefer otherwise.

## Scope

ForgeDialog renders UI in the browser and ships no server component, so most reports will concern
how untrusted content reaches the DOM.

**In scope**

- Content passed through documented APIs escaping into the DOM as markup when it should be text.
- Anything letting a dialog break out of its accessibility or focus containment in a way that
  enables clickjacking or input capture.
- Supply-chain issues in what the package publishes: unexpected files in the tarball, or a build
  artifact that does not match this source.

**Out of scope**

- `unsafeHtml`. It is documented as trusted-input-only and performs no sanitization by design;
  passing user input to it is a bug in the calling application. Use `html` together with
  `sanitizeHtml`, which refuses to render until a sanitizer is supplied.
- Vulnerabilities in an application's own sanitizer implementation.
- Findings that require an attacker to already execute script on the page.

## What the project does on its own behalf

- `content` and `message` strings are rendered as text, never parsed as markup.
- `npm run test:csp` fails the build if `eval` or `new Function` appears in `dist/`, so the package
  stays usable under a strict Content Security Policy.
- Releases publish with npm provenance and attach a CycloneDX SBOM.
- Development dependencies are kept free of known advisories; `npm audit` is expected to be clean.
