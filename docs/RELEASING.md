# Release process

1. Update `VERSION` in `custom_components/vikunja/const.py` and `version` in `manifest.json` to the same semantic version.
2. Move user-visible entries from **Unreleased** into a dated changelog release section.
3. Run all checks in [DEVELOPMENT.md](DEVELOPMENT.md) and complete a privacy review of every public file.
4. Commit the release preparation on a focused branch and merge it through a pull request after repository validation, Hassfest, and HACS validation pass.
5. Verify the merged `main` tree exactly matches the approved release candidate.
6. Create an annotated `vX.Y.Z` tag on the merged release commit and push only that tag.
7. The release workflow verifies the tag against both version declarations and creates a draft GitHub release.
8. Replace or expand generated text with detailed, release-specific notes drawn from the dated changelog section. Do not publish a release that contains only a comparison link.
9. Confirm the title, notes, tag, assets, and privacy review, then publish the release.
10. Delete merged release branches and any duplicate draft releases after confirming the published release is complete.

Do not publish from an unclean tree or rewrite a tag that users may have installed.
