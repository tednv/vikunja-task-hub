# Release process

1. Update `VERSION` in `custom_components/vikunja/const.py` and `version` in `manifest.json` to the same semantic version.
2. Move user-visible entries from **Unreleased** into a dated changelog release section.
3. Run all checks in [DEVELOPMENT.md](DEVELOPMENT.md) and complete a privacy review of every public file.
4. Build the public release branch from the sanitized public default branch. Apply only the reviewed net change as one consolidated release commit; never publish local deployment-checkpoint ancestry, session chronology, or work cadence.
5. Verify the merged `main` tree exactly matches the approved release candidate.
6. Create an annotated `vX.Y.Z` tag on the merged release commit and push only that tag.
7. The release workflow verifies the tag against both version declarations and creates a draft GitHub release.
8. Replace or expand generated text with detailed, release-specific notes drawn from the dated changelog section. Do not publish a release that contains only a comparison link.
9. Confirm the title, notes, tag, assets, and privacy review, then publish the release.
10. Delete merged release branches and any duplicate draft releases after confirming the published release is complete.

Before any push, inspect the full outgoing ancestry, author and committer metadata, tags, screenshots, generated assets, and diff. Public screenshots must use invented sample data and neutral URLs. Local session history, agent instructions, deployment identifiers, checkpoint hashes, timestamps describing work cadence, and private infrastructure details must remain absent from both the tree and reachable Git history.

Do not publish from an unclean tree or rewrite a tag that users may have installed.
