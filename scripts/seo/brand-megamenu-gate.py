#!/usr/bin/env python3
"""Regression gate: AGI public clean URL must render AGI's own desktop menu."""
from pathlib import Path

navigation = Path("components/Navigation.tsx").read_text(encoding="utf-8")
brand_nav = Path("contexts/BrandContext.tsx").read_text(encoding="utf-8")

checks = {
    "AGI is based on the brand identity, not the URL path":
        'const isAgiWorks = brand.id === "agiworks";' in navigation,
    "AGI desktop branch uses the brand selector":
        '                {isAgiWorks ? (' in navigation,
    "The old pathname-based desktop selector is gone":
        '                {pathname?.startsWith("/agiworks") ? (' not in navigation,
    "AGI desktop panel is present":
        'data-agi-premium-menu="true"' in navigation and
        'AGI Works · Lösungen' in navigation,
    "NEXCEL panel remains isolated in the other branch":
        ') : (<NexcelCompactMegaMenu items={solutionsSystemItems}' in navigation,
    "AGI heading and link use AGI identity":
        'data-llm-menu-feature="agiworks"' in navigation and
        'href="/leistungen/eigene-llms"' in navigation,
    "AGI host is recognized by the root brand context":
        'host.includes("agiworks")' in brand_nav,
}
for label, ok in checks.items():
    print(f'{"PASS" if ok else "FAIL"}: {label}')
if not all(checks.values()):
    raise SystemExit("BRAND_MEGA_MENU_GATE: FAIL")
print("BRAND_MEGA_MENU_GATE: PASS")
