#!/usr/bin/env python3
"""Convert verified GSC Performance CSV exports to actionable non-branded page opportunities."""
import argparse
import csv
import json
import math
from pathlib import Path
from urllib.parse import urlparse


def f(row, *keys):
    for k in keys:
        if row.get(k) not in (None, ""):
            return row[k]
    return ""

def number(value):
    try:
        return float(str(value).strip().replace("%", "").replace(",", "."))
    except ValueError:
        return 0.0

p = argparse.ArgumentParser(description=__doc__)
p.add_argument("csv", type=Path, help="GSC performance export with query/page/impressions/clicks/position")
p.add_argument("--out", type=Path, default=Path("seo_growth_opportunities.csv"))
args = p.parse_args()
items = []
with args.csv.open(encoding="utf-8-sig", newline="") as handle:
    reader = csv.DictReader(handle)
    for row in reader:
        query = f(row, "query", "Suchanfragen", "Top queries", "Suchanfrage").strip()
        page = f(row, "page", "Seite", "Pages", "URL").strip()
        impression = number(f(row, "impressions", "Impressions", "Impressionen"))
        clicks = number(f(row, "clicks", "Clicks", "Klicks"))
        position = number(f(row, "position", "Position", "Average position", "Durchschnittliche Position"))
        if not query or impression < 15 or position < 3 or position > 45:
            continue
        low = query.lower()
        if any(term in low for term in ["nexcel", "agiworks", "agi works", "celina siebeneicher", "kevin blazevic"]):
            continue
        domain = urlparse(page).hostname or "unknown"
        commercial = any(term in low for term in ["agentur", "beratung", "entwicklung", "software", "crm", "erp", "ki", "llm", "automatis", "preise", "kosten", "anbieter"])
        ctr = clicks / impression if impression else 0
        score = round(math.log1p(impression) * (1 + int(commercial)) * (1 - ctr) * (1 if position < 20 else .65), 3)
        items.append({"domain": domain, "query": query, "page": page, "impressions": int(impression), "clicks": int(clicks), "ctr": round(ctr, 4), "position": round(position, 1), "commercial_intent_hint": commercial, "priority_score": score})
items.sort(key=lambda x: -x["priority_score"])
args.out.parent.mkdir(parents=True, exist_ok=True)
with args.out.open("w", encoding="utf-8", newline="") as handle:
    writer = csv.DictWriter(handle, fieldnames=list(items[0]) if items else ["domain", "query", "page", "impressions", "clicks", "ctr", "position", "commercial_intent_hint", "priority_score"])
    writer.writeheader()
    writer.writerows(items)
print(json.dumps({"rows": len(items), "export": str(args.out), "top": items[:10]}, ensure_ascii=False, indent=2))
