#!/usr/bin/env python3
"""Static guard for premium dark-only brand invariant (no browser needed)."""
from pathlib import Path
root = Path(__file__).resolve().parents[2]
layout = (root / 'app/layout.tsx').read_text(encoding='utf-8')
context = (root / 'contexts/ThemeContext.tsx').read_text(encoding='utf-8')
css = (root / 'app/globals.css').read_text(encoding='utf-8')
assert 'localStorage.getItem(\'theme\')' not in layout
assert 'localStorage.getItem("theme")' not in context
assert 'root.classList.remove("light")' in context
assert 'root.classList.add("dark")' in context
assert 'meta name="color-scheme" content="dark"' in layout
assert 'color-scheme: dark;' in css
assert "@media (prefers-color-scheme: dark)" not in css, 'OS theme must not change nav rules'
print('DARK_ONLY_GATE_OK')
