# Release process

1. Confirm the default branch passes repository validation, Hassfest, and HACS validation.
2. Update `VERSION` in `custom_components/vikunja/const.py` and `version` in `manifest.json` to the same semantic version.
3. Move user-visible entries from **Unreleased** into a dated changelog release section.
4. Run all checks in [DEVELOPMENT.md](DEVELOPMENT.md).
5. Commit the release preparation.
6. Create and push an annotated tag named `vX.Y.Z`.
7. The release workflow verifies the tag matches both version declarations and creates a draft GitHub release.
8. Review generated notes, attach any required artifacts, and publish the release.

Do not publish from an unclean tree or rewrite a tag that users may have installed.
