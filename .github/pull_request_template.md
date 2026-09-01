## Summary

<!-- What changed and why. Call out API or accessibility impact explicitly. -->

## Verification

<!-- Tick what you ran. `npm run validate` is the same gate CI uses. -->

- [ ] `npm run validate`
- [ ] `npm run test:e2e` (needs `npx playwright install`), or a note below on why it was skipped
- [ ] Added or updated tests covering the change

## Checklist

- [ ] Added a changeset (`npm run changeset`) for user-facing changes
- [ ] Refreshed API reports (`npm run api:update`, `npm run api:subpaths:update`) if the public
      surface changed
- [ ] Raised a gzip budget in this PR, with a reason, if the change needed more room
- [ ] Refreshed the visual baseline, and said so, if a demo change shifted the screenshot

## Screenshots

<!-- For visual, animation, or demo changes. Delete this section if it does not apply. -->
