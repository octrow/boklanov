#!/usr/bin/env python3
"""
Migrate content from .mdx (frontmatter + optional body) to a clean split:

  productions/<slug>/index.mdx       ->  index.yaml + body.{ru,en,de}.md
  about/<lang>.mdx                   ->  <lang>.yaml + <lang>.md

The `.mdx` files in productions/ have all prose stuffed inside the
`body: { ru, en, de }` frontmatter key. We extract that key into separate
markdown files and leave the rest of the frontmatter as a pure .yaml file.

The `.mdx` files in about/ already have prose AFTER the closing `---`.
We split that body into a sibling .md file.

Idempotent: skips slugs whose target index.yaml already exists.
Default is --dry-run; pass --apply to actually write/delete.

Usage:
  python3 scripts/migrate_mdx_to_yaml.py --dry-run
  python3 scripts/migrate_mdx_to_yaml.py --apply
  python3 scripts/migrate_mdx_to_yaml.py --apply --slug aiaccio   # one record
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
PRODUCTIONS = ROOT / "content" / "productions"
ABOUT = ROOT / "content" / "about"

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?\n)---\s*\n?(.*)$", re.DOTALL)


# --- YAML dumper tuning --------------------------------------------------- #
# Prefer double quotes when quoting is needed (matches the existing files'
# convention) and never sort keys (preserve original order from PyYAML's
# dict, which is insertion-ordered on 3.7+).

class _Dumper(yaml.SafeDumper):
    # Indent block sequences under their parent key (PyYAML default does not).
    # Matches the original .mdx style: "form:\n  - family"
    def increase_indent(self, flow: bool = False, indentless: bool = False):
        del indentless  # we always want indented sequences
        return super().increase_indent(flow, False)


def _str_representer(dumper: yaml.SafeDumper, data: str):
    # Multi-line strings -> literal block scalar (|)
    if "\n" in data:
        return dumper.represent_scalar("tag:yaml.org,2002:str", data, style="|")
    # Strings that contain YAML-special chars or look like other types -> quote
    needs_quote = bool(re.search(r"[:#&*!|>'\"%@`]", data)) or data.strip() != data
    if needs_quote:
        return dumper.represent_scalar("tag:yaml.org,2002:str", data, style='"')
    return dumper.represent_scalar("tag:yaml.org,2002:str", data)


_Dumper.add_representer(str, _str_representer)


def dump_yaml(data: dict) -> str:
    return yaml.dump(
        data,
        Dumper=_Dumper,
        sort_keys=False,
        allow_unicode=True,
        width=10_000,  # don't auto-wrap; preserves single-line strings
        default_flow_style=False,
    )


# --- Parsing -------------------------------------------------------------- #

def parse_mdx(text: str) -> tuple[dict, str]:
    """Return (frontmatter_dict, body_after_closing_delim).

    body is the raw text after the closing ---. Empty for productions/.
    """
    m = FRONTMATTER_RE.match(text)
    if not m:
        raise ValueError("no frontmatter found")
    fm_text = m.group(1)
    body = m.group(2)
    fm = yaml.safe_load(fm_text) or {}
    return fm, body


# --- Migration logic ------------------------------------------------------ #

def migrate_production(slug_dir: Path, *, apply: bool) -> dict:
    """Returns a per-slug action report."""
    mdx = slug_dir / "index.mdx"
    yaml_path = slug_dir / "index.yaml"
    report = {"slug": slug_dir.name, "actions": [], "skipped": False}

    if not mdx.exists():
        report["skipped"] = True
        report["reason"] = "no index.mdx"
        return report
    if yaml_path.exists():
        report["skipped"] = True
        report["reason"] = "index.yaml already exists (idempotent skip)"
        return report

    fm, trailing_body = parse_mdx(mdx.read_text(encoding="utf-8"))
    if trailing_body.strip():
        # Productions aren't supposed to have a trailing MDX body; warn.
        report["actions"].append(
            f"WARN: trailing MDX body present ({len(trailing_body)} chars) — preserved into body.<locale>.md is NOT trivial; aborting"
        )
        report["skipped"] = True
        return report

    body = fm.pop("body", None) or {}
    if not isinstance(body, dict):
        report["actions"].append(f"WARN: body is not a dict ({type(body).__name__}); skipping")
        report["skipped"] = True
        return report

    # Write body.<locale>.md for each non-empty locale.
    for locale in ("ru", "en", "de"):
        prose = body.get(locale)
        if not prose or not str(prose).strip():
            continue
        target = slug_dir / f"body.{locale}.md"
        report["actions"].append(f"write  {target.relative_to(ROOT)}  ({len(prose)} chars)")
        if apply:
            # Ensure trailing newline; strip any leading/trailing blanks
            target.write_text(str(prose).strip() + "\n", encoding="utf-8")

    # Write the cleaned frontmatter as index.yaml.
    yaml_text = dump_yaml(fm)
    report["actions"].append(f"write  {yaml_path.relative_to(ROOT)}  ({len(yaml_text)} chars)")
    if apply:
        yaml_path.write_text(yaml_text, encoding="utf-8")

    # Delete the old .mdx.
    report["actions"].append(f"delete {mdx.relative_to(ROOT)}")
    if apply:
        mdx.unlink()

    return report


def migrate_about(mdx_path: Path, *, apply: bool) -> dict:
    """about/<lang>.mdx -> <lang>.yaml + <lang>.md (when prose body exists)."""
    yaml_path = mdx_path.with_suffix(".yaml")
    md_path = mdx_path.with_suffix(".md")
    report = {"file": mdx_path.name, "actions": [], "skipped": False}

    if yaml_path.exists():
        report["skipped"] = True
        report["reason"] = f"{yaml_path.name} already exists (idempotent skip)"
        return report

    fm, trailing = parse_mdx(mdx_path.read_text(encoding="utf-8"))
    prose = trailing.lstrip("\n").rstrip() + "\n" if trailing.strip() else ""

    yaml_text = dump_yaml(fm)
    report["actions"].append(f"write  {yaml_path.relative_to(ROOT)}  ({len(yaml_text)} chars)")
    if apply:
        yaml_path.write_text(yaml_text, encoding="utf-8")

    if prose:
        report["actions"].append(f"write  {md_path.relative_to(ROOT)}  ({len(prose)} chars)")
        if apply:
            md_path.write_text(prose, encoding="utf-8")

    report["actions"].append(f"delete {mdx_path.relative_to(ROOT)}")
    if apply:
        mdx_path.unlink()

    return report


# --- CLI ------------------------------------------------------------------ #

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="actually write/delete (default is dry-run)")
    parser.add_argument("--dry-run", action="store_true", help="explicit dry-run (default)")
    parser.add_argument("--slug", help="migrate only this production slug")
    parser.add_argument("--skip-about", action="store_true", help="don't migrate content/about/")
    parser.add_argument("--skip-productions", action="store_true", help="don't migrate content/productions/")
    args = parser.parse_args()

    apply = args.apply
    if not apply:
        print("[dry-run] no files will be changed. pass --apply to write.\n")

    reports: list[dict] = []

    if not args.skip_productions:
        if args.slug:
            slug_dirs = [PRODUCTIONS / args.slug]
        else:
            slug_dirs = sorted(p for p in PRODUCTIONS.iterdir() if p.is_dir())
        for d in slug_dirs:
            reports.append(migrate_production(d, apply=apply))

    if not args.skip_about and not args.slug:
        for f in sorted(ABOUT.glob("*.mdx")):
            reports.append(migrate_about(f, apply=apply))

    # Print compact report
    n_done = 0
    n_skip = 0
    for r in reports:
        label = r.get("slug") or r.get("file")
        if r["skipped"]:
            n_skip += 1
            print(f"  SKIP   {label}  — {r.get('reason', '')}")
        else:
            n_done += 1
            print(f"  OK     {label}")
            for a in r["actions"]:
                print(f"           {a}")

    print(f"\nSummary: {n_done} migrated, {n_skip} skipped, {len(reports)} total")
    if not apply:
        print("\nThis was a dry run. Re-run with --apply to write.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
