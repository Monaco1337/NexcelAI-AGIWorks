#!/usr/bin/env python3
"""Static regression guard for nonvisual SEO hierarchy and clean public AGI links."""
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[2]
checks = {
    'components/templates/MoneyPageTemplate.tsx': ['{ label: collectionLabel, href: page.collection === "leistungen" ? "/leistungen" : "/loesungen" },'],
    'components/templates/LocationPageTemplate.tsx': ['{ label: "Standorte", href: "/standorte" },'],
    'components/templates/KnowledgePageTemplate.tsx': ['{ label: "Wissen", href: "/wissen" },'],
    'components/trust/Breadcrumbs.tsx': ['key={`${item.href}-${i}`}'],
    'app/agiworks/leistungen/page.tsx': ['if (p === "/leistungen" || p.startsWith("/leistungen/")) return p;', 'href="/kontakt"'],
    'app/agiworks/leistungen/eigene-llms/page.tsx': ['href="/leistungen"', 'href="/kontakt?betreff=LLM-Engineering"', 'href="/preise"'],
}
fail = []
for name, snippets in checks.items():
    content = (ROOT / name).read_text(encoding='utf-8')
    for snippet in snippets:
        if snippet not in content:
            fail.append(f'MISSING: {name}: {snippet}')
for name in ('components/templates/MoneyPageTemplate.tsx', 'components/templates/LocationPageTemplate.tsx', 'components/templates/KnowledgePageTemplate.tsx'):
    content = (ROOT / name).read_text(encoding='utf-8')
    if 'href: page.path },\n      { label:' in content:
        fail.append(f'OLD_SELF_LINKED_PARENT: {name}')
for name in ('app/agiworks/leistungen/page.tsx', 'app/agiworks/leistungen/eigene-llms/page.tsx'):
    content = (ROOT / name).read_text(encoding='utf-8')
    if 'href="/agiworks/' in content:
        fail.append(f'INTERNAL_PREFIX_LINK: {name}')
if fail:
    print('\n'.join(fail), file=sys.stderr)
    sys.exit(1)
print('NONVISUAL_SEO_GUARD_OK:', len(checks), 'source files checked')
