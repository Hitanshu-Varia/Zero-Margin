#!/usr/bin/env python3
"""Fail on incomplete markers and unqualified claims in the web terminal repo."""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TARGET_DIRS = ["app", "components", "lib"]
TARGET_FILES = ["README.md", "brand.md"]
SUFFIXES = {".ts", ".tsx", ".md"}
SKIP = {"node_modules", ".next", "out"}

ALWAYS = [
    r"\bTBD\b", r"\bTODO\b", r"\bFIXME\b", r"\bPLACEHOLDER\b", r"\betc\.",
    r"\bas needed\b", r"\bguaranteed? profit\b",
    r"\beliminates? (all )?(trading )?(liquidation )?risk\b",
    r"\bzero risk\b", r"\bfirst ever\b", r"\bworld'?s first\b",
    r"\binstitutional-grade\b", r"\bSEC-compliant\b", r"\bCME-compliant\b",
    r"\btrustless\b", r"\blive hedge\b", r"\breal-time\b",
]
NEGATED = [r"\baudited\b", r"\bproduction-ready\b", r"\brisk[- ]free\b"]
NEGATION = re.compile(r"\b(not|never|no|without|isn't|is not|doesn't|does not)\b[^.]{0,60}$", re.I)
WARN = [r"\bCME SPAN\b", r"\bclearinghouse\b"]


def files():
    for name in TARGET_DIRS:
        base = ROOT / name
        if not base.exists():
            continue
        for path in sorted(base.rglob("*")):
            if path.is_file() and path.suffix in SUFFIXES and not (set(path.parts) & SKIP):
                yield path
    for name in TARGET_FILES:
        path = ROOT / name
        if path.exists():
            yield path


errors: list[str] = []
warnings: list[str] = []

for path in files():
    rel = path.relative_to(ROOT)
    for number, line in enumerate(
        path.read_text(encoding="utf-8", errors="ignore").splitlines(), 1
    ):
        for pattern in ALWAYS:
            if re.search(pattern, line, re.I):
                errors.append(f"{rel}:{number}: always banned: {pattern} :: {line.strip()[:160]}")
        for pattern in NEGATED:
            for match in re.finditer(pattern, line, re.I):
                if not NEGATION.search(line[: match.start()]):
                    errors.append(
                        f"{rel}:{number}: unqualified claim: {pattern} :: {line.strip()[:160]}"
                    )
        for pattern in WARN:
            if re.search(pattern, line, re.I):
                warnings.append(f"{rel}:{number}: prefer 'SPAN-style' or 'margin engine': {line.strip()[:160]}")

for warning in warnings:
    print("WARN", warning)

if errors:
    for error in errors:
        print("FAIL", error)
    sys.exit(1)

print("PASS: no incomplete markers or unqualified claims")
