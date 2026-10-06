"""Validate standalone repository metadata without Home Assistant imports."""

from __future__ import annotations

import argparse
import ast
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INTEGRATION = ROOT / "custom_components" / "vikunja"
SETUP_TRANSLATIONS = INTEGRATION / "translations"
CARD_TRANSLATIONS = INTEGRATION / "frontend" / "translations"
EXPECTED_SETUP_LOCALES = {
    "ar", "bn", "de", "el", "en", "es", "fa", "fr", "ga", "hi", "hu",
    "id", "it", "ja", "ko", "nl", "pl", "pt", "ro", "ru", "sr", "th",
    "tr", "uk", "ur", "vi", "zh-Hans",
}
EXPECTED_CARD_LOCALES = (EXPECTED_SETUP_LOCALES - {"zh-Hans"}) | {"zh"}
JSON_FILES = (
    ROOT / "hacs.json",
    ROOT / ".prettierrc.json",
    INTEGRATION / "manifest.json",
    INTEGRATION / "strings.json",
    *sorted(SETUP_TRANSLATIONS.glob("*.json")),
    *sorted(CARD_TRANSLATIONS.glob("*.json")),
)
MARKDOWN_LINK = re.compile(r"\[[^\]]*\]\(([^)]+)\)")


def constant_value(path: Path, name: str) -> str:
    """Read a simple string constant without importing Home Assistant code."""
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    for node in tree.body:
        if not isinstance(node, ast.Assign):
            continue
        if any(isinstance(target, ast.Name) and target.id == name for target in node.targets):
            if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
                return node.value.value
    raise ValueError(f"{name} was not found in {path}")


def schema(value: object) -> object:
    """Return a nested key-only representation of a translation document."""
    if isinstance(value, dict):
        return {key: schema(child) for key, child in value.items()}
    return str


def main() -> None:
    """Validate JSON, versions, translations, and required standalone files."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--release-tag")
    args = parser.parse_args()

    parsed = {path: json.loads(path.read_text(encoding="utf-8")) for path in JSON_FILES}
    manifest = parsed[INTEGRATION / "manifest.json"]
    version = constant_value(INTEGRATION / "const.py", "VERSION")
    if manifest["version"] != version:
        raise SystemExit(f"Version mismatch: manifest={manifest['version']} const={version}")

    if parsed[INTEGRATION / "strings.json"] != parsed[SETUP_TRANSLATIONS / "en.json"]:
        raise SystemExit("strings.json and translations/en.json differ")

    setup_locales = {path.stem for path in SETUP_TRANSLATIONS.glob("*.json")}
    if setup_locales != EXPECTED_SETUP_LOCALES:
        raise SystemExit("Setup translation files do not match supported locales")
    setup_schema = schema(parsed[INTEGRATION / "strings.json"])
    for locale in sorted(setup_locales):
        document = parsed[SETUP_TRANSLATIONS / f"{locale}.json"]
        if schema(document) != setup_schema:
            raise SystemExit(f"Setup translation schema mismatch: {locale}")

    card_locales = {path.stem for path in CARD_TRANSLATIONS.glob("*.json")}
    if card_locales != EXPECTED_CARD_LOCALES:
        raise SystemExit("Card translation files do not match supported locales")
    card_keys = set(parsed[CARD_TRANSLATIONS / "en.json"])
    for locale in sorted(card_locales):
        document = parsed[CARD_TRANSLATIONS / f"{locale}.json"]
        if set(document) != card_keys:
            raise SystemExit(f"Card translation key mismatch: {locale}")
        if any(not isinstance(value, str) or not value.strip() for value in document.values()):
            raise SystemExit(f"Card translation contains an empty value: {locale}")

    required = (
        ROOT / "README.md",
        ROOT / "LICENSE",
        ROOT / "NOTICE",
        ROOT / "SECURITY.md",
        ROOT / "CONTRIBUTING.md",
        ROOT / "CHANGELOG.md",
    )
    missing = [str(path.relative_to(ROOT)) for path in required if not path.is_file()]
    if missing:
        raise SystemExit(f"Missing required repository files: {', '.join(missing)}")

    integration_directories = [
        path for path in (ROOT / "custom_components").iterdir() if path.is_dir()
    ]
    if integration_directories != [INTEGRATION]:
        names = ", ".join(path.name for path in integration_directories)
        raise SystemExit(f"Expected only custom_components/vikunja; found: {names}")

    if manifest["domain"] != INTEGRATION.name:
        raise SystemExit("Manifest domain does not match the integration directory")

    obsolete_paths = (
        ROOT / "art",
        ROOT / ".github" / "workflows" / "release-create.yml",
        ROOT / ".github" / "workflows" / "update_version_to_tag.yml",
    )
    present = [str(path.relative_to(ROOT)) for path in obsolete_paths if path.exists()]
    if present:
        raise SystemExit(f"Obsolete inherited paths remain: {', '.join(present)}")

    markdown_files = list(ROOT.glob("*.md")) + list((ROOT / "docs").rglob("*.md"))
    broken_links = []
    for markdown_file in markdown_files:
        content = markdown_file.read_text(encoding="utf-8")
        for link in MARKDOWN_LINK.findall(content):
            if link.startswith(("http://", "https://", "#", "mailto:")):
                continue
            relative_target = link.split("#", 1)[0]
            if not relative_target:
                continue
            target = (markdown_file.parent / relative_target).resolve()
            if not target.exists():
                broken_links.append(f"{markdown_file.relative_to(ROOT)} -> {relative_target}")
    if broken_links:
        raise SystemExit(f"Broken Markdown links: {', '.join(broken_links)}")

    if args.release_tag:
        expected_tag = f"v{version}"
        if args.release_tag != expected_tag:
            raise SystemExit(f"Release tag {args.release_tag} does not match {expected_tag}")


if __name__ == "__main__":
    main()
