"""
Wire admin.components.Field (text/textarea) or admin.components.Description
(richText) onto every `localized: true` field in the Payload config files.

Archive of the one-shot transformer used 2026-05-18 to roll the
per-field locale UX out across all 31 localized fields in Productions,
About, and Contact. See PAYLOAD_ADMIN_UX_PLAN.md → "Progress log →
Step 2" for context.

Strategy: walk the source as a comment-aware token stream, tracking
brace depth + string state. For every balanced `{ ... }` that looks
like a field object (has `name:` + `type:` at direct-child indent and
`localized: true` at the same indent), inject the right
`admin.components.{Field|Description}` reference, creating the
`admin: { components: { ... } }` scaffolding if it doesn't exist.

Comment-aware: skips `//` line and `/* ... */` block comments so
apostrophes in comments like `don't` don't enter the matcher's string
state and desync brace tracking. The original naive version missed
~15 fields in Productions before this fix landed.

Idempotent: if the field already has the expected Field/Description
ref in its body, the script leaves it alone.

Usage:
    python3 .design/boklanov-rewrite/scripts/wire-localized-fields.py

Run from the repo root. Reports per-file count of fields wired. If any
fields remain unwired after the run, double-check the indentation is
consistent and re-run. Re-running on an already-wired file is a
no-op.

Not committed under `scripts/` (production scripts) because this is a
one-time migration helper, not part of the build. Kept here in case
we add more localized fields later and want to re-run.
"""
import re
from pathlib import Path

TEXT_FIELD_REF = "'/components/admin/LocalizedText#default'"
TEXTAREA_FIELD_REF = "'/components/admin/LocalizedTextarea#default'"
RICHTEXT_DESC_REF = "'/components/admin/LocalizedRichTextTabs#default'"


def field_blocks(src):
    """
    Yield (start, end, body) for every balanced `{...}` in `src`. Skips
    over comments and string literals so quotes inside `//` line
    comments (e.g. "don't reshape") don't confuse string-state tracking.
    """
    n = len(src)
    i = 0
    stack = []
    matches = []
    in_string = None
    escape = False
    while i < n:
        c = src[i]
        nxt = src[i + 1] if i + 1 < n else ""
        if in_string:
            if escape:
                escape = False
            elif c == "\\":
                escape = True
            elif c == in_string:
                in_string = None
            i += 1
            continue
        # Skip `//` line comments
        if c == "/" and nxt == "/":
            j = src.find("\n", i)
            i = n if j < 0 else j
            continue
        # Skip `/* ... */` block comments
        if c == "/" and nxt == "*":
            j = src.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        if c in ("'", '"', '`'):
            in_string = c
        elif c == "{":
            stack.append(i)
        elif c == "}":
            if stack:
                open_idx = stack.pop()
                matches.append((open_idx, i))
        i += 1
    for open_idx, close_idx in matches:
        body = src[open_idx + 1 : close_idx]
        yield (open_idx, close_idx, body)


# Match `name: '...'` and `type: '...'` and `localized: true` in the
# IMMEDIATE body (skip nested objects). We use the fact that direct
# children appear at a smaller indent than nested ones.
def has_localized_true(body):
    # localized: true must appear as a top-level key of THIS block, not nested.
    return bool(re.search(r"^(\s*)localized: true,?\s*$", body, re.MULTILINE))


def extract_type(body):
    # Take the FIRST top-level `type: 'xxx',` in this block.
    m = re.search(r"^(\s*)type: '([a-zA-Z]+)',?\s*$", body, re.MULTILINE)
    if not m:
        return None
    return m.group(2)


def extract_indent(body):
    """Detect the indent used for direct properties of this block (leading whitespace
    of the FIRST `name:` or `type:` line)."""
    for line in body.splitlines():
        m = re.match(r"^(\s+)(?:name|type|label|localized|required|admin):", line)
        if m:
            return m.group(1)
    return "  "


def is_direct_child_line(body, indent):
    """True if `localized: true` appears at the expected indent (not nested)."""
    pat = re.compile(r"^" + re.escape(indent) + r"localized: true,?\s*$", re.MULTILINE)
    return bool(pat.search(body))


def make_admin_block(type_, indent):
    """Build a new `admin: { components: { ... } }` snippet at the given indent."""
    if type_ == "richText":
        comp_key = "Description"
        comp_val = RICHTEXT_DESC_REF
    elif type_ == "textarea":
        comp_key = "Field"
        comp_val = TEXTAREA_FIELD_REF
    else:
        comp_key = "Field"
        comp_val = TEXT_FIELD_REF
    inner = indent + "  "
    inner2 = indent + "    "
    return (
        f"{indent}admin: {{\n"
        f"{inner}components: {{\n"
        f"{inner2}{comp_key}: {comp_val}\n"
        f"{inner}}}\n"
        f"{indent}}}"
    )


def inject_into_admin(admin_body, type_, indent):
    """
    Given the inside of an existing `admin: { ... }` block, ensure a
    `components: { Field/Description: ... }` entry is present.
    `indent` is the indent of admin's direct children.
    """
    if type_ == "richText":
        comp_key = "Description"
        comp_val = RICHTEXT_DESC_REF
    elif type_ == "textarea":
        comp_key = "Field"
        comp_val = TEXTAREA_FIELD_REF
    else:
        comp_key = "Field"
        comp_val = TEXT_FIELD_REF

    # Already wired?
    if comp_val in admin_body and f"{comp_key}: {comp_val}" in admin_body:
        return admin_body, False

    # Does a `components: {` already exist at admin's direct child level?
    comp_re = re.compile(r"^" + re.escape(indent) + r"components: \{", re.MULTILINE)
    m = comp_re.search(admin_body)
    if m:
        # Insert our key inside the existing components block.
        # Find the closing brace of this components block.
        # Walk forward from m.end() (the char after `{`).
        depth = 1
        i = m.end()
        in_str = None
        esc = False
        while i < len(admin_body) and depth > 0:
            c = admin_body[i]
            if in_str:
                if esc:
                    esc = False
                elif c == "\\":
                    esc = True
                elif c == in_str:
                    in_str = None
            elif c in ("'", '"', '`'):
                in_str = c
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    break
            i += 1
        if depth != 0:
            return admin_body, False
        close_brace_idx = i
        inner_indent = indent + "  "
        # Detect whether components block already has entries (need a comma).
        between = admin_body[m.end():close_brace_idx]
        has_entry = bool(re.search(r"\S", between))
        prefix = "," if has_entry and not between.rstrip().endswith(",") else ""
        new_line = f"{prefix}\n{inner_indent}{comp_key}: {comp_val}"
        new_admin_body = (
            admin_body[:close_brace_idx]
            + new_line
            + "\n" + indent
            + admin_body[close_brace_idx:]
        )
        return new_admin_body, True
    else:
        # No components block — append one. Need a comma after the last
        # existing entry if any.
        inner_indent = indent + "  "
        addition = (
            f",\n{indent}components: {{\n"
            f"{inner_indent}{comp_key}: {comp_val}\n"
            f"{indent}}}"
        )
        # Insert before the closing brace of admin. Strip trailing whitespace
        # before the close, then append.
        # admin_body is the inside of admin{}. We want to add at the end.
        # But callers will replace the FULL admin block, so just append
        # before any trailing newline/whitespace.
        stripped = admin_body.rstrip()
        # Find last comma vs not — if last non-space char is `}` (nested obj)
        # we need a comma before our addition.
        last_char = stripped[-1] if stripped else ""
        if last_char in (",",):
            addition = addition.lstrip(",")
            new_admin_body = stripped + addition + "\n" + (
                admin_body[len(stripped):] if len(admin_body) > len(stripped) else "\n"
            )
        else:
            new_admin_body = stripped + addition + "\n"
        # Preserve trailing indent before the closing `}` of admin
        return new_admin_body, True


def process_file(path):
    src = Path(path).read_text()
    edits = []  # list of (start, end, replacement)
    fields_changed = 0

    # Iterate block-by-block; only consider blocks that look like a field object.
    for open_idx, _close, body in field_blocks(src):  # close idx unused; brace pair already balanced
        # Check this is a field block at all
        if not re.search(r"^\s*type: '", body, re.MULTILINE):
            continue
        type_ = extract_type(body)
        if type_ not in ("text", "textarea", "richText"):
            continue
        indent = extract_indent(body)
        if not is_direct_child_line(body, indent):
            continue
        # OK — this is a localized text/textarea/richText field.
        # Already wired?
        ref = (
            RICHTEXT_DESC_REF
            if type_ == "richText"
            else TEXTAREA_FIELD_REF
            if type_ == "textarea"
            else TEXT_FIELD_REF
        )
        if ref in body:
            continue

        # Find `admin: {...}` at the direct-child level.
        admin_open_pat = re.compile(
            r"^(" + re.escape(indent) + r")admin: \{", re.MULTILINE
        )
        m = admin_open_pat.search(body)
        if m:
            # Find the matching close brace of this admin block (in `body` coords).
            depth = 1
            j = m.end()
            in_str = None
            esc = False
            while j < len(body) and depth > 0:
                c = body[j]
                if in_str:
                    if esc:
                        esc = False
                    elif c == "\\":
                        esc = True
                    elif c == in_str:
                        in_str = None
                elif c in ("'", '"', '`'):
                    in_str = c
                elif c == "{":
                    depth += 1
                elif c == "}":
                    depth -= 1
                    if depth == 0:
                        break
                j += 1
            if depth != 0:
                continue
            admin_inside_start = m.end()  # right after `{`
            admin_inside_end = j  # the `}` index
            admin_inside = body[admin_inside_start:admin_inside_end]
            admin_child_indent = indent + "  "
            new_inside, changed = inject_into_admin(
                admin_inside, type_, admin_child_indent
            )
            if not changed:
                continue
            # Replace inside the file: convert body coords to src coords.
            abs_inside_start = open_idx + 1 + admin_inside_start
            abs_inside_end = open_idx + 1 + admin_inside_end
            edits.append((abs_inside_start, abs_inside_end, new_inside))
            fields_changed += 1
        else:
            # Append a new admin block at the end of this field body.
            new_block = make_admin_block(type_, indent)
            # Insert before the closing `}` of the field. body ends without it.
            # We'll insert at body END (just before close_idx), and add comma if
            # needed.
            field_body = body
            stripped = field_body.rstrip()
            last_char = stripped[-1] if stripped else ""
            need_comma = last_char not in (",", "{")
            sep = ",\n" if need_comma else "\n"
            inserted = sep + new_block + "\n" + indent[:-2]  # trailing indent before `}`
            # Compute exact insertion point in src.
            insert_at = open_idx + 1 + len(stripped)
            edits.append((insert_at, insert_at, inserted))
            fields_changed += 1

    # Apply edits in reverse so indices stay valid.
    edits.sort(key=lambda e: e[0], reverse=True)
    out = src
    for start, end, repl in edits:
        out = out[:start] + repl + out[end:]
    return out, fields_changed


if __name__ == "__main__":
    files = [
        "collections/Productions.ts",
        "globals/About.ts",
        "globals/Contact.ts",
    ]
    for f in files:
        new, n = process_file(f)
        Path(f).write_text(new)
        print(f"{f}: {n} field(s) wired")
