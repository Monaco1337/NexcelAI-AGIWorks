#!/usr/bin/env python3
"""Fail closed if public AGI paths or brand-specific booking contracts regress."""
from pathlib import Path

base = Path(".")
agi = (base / "components/templates/AgiWorksPremiumDetail.tsx").read_text(encoding="utf-8")
pricing = (base / "components/sections/PricingSection.tsx").read_text(encoding="utf-8")
registry = (base / "config/seo/pageRegistry.ts").read_text(encoding="utf-8")
slots = (base / "lib/consultations/slots.ts").read_text(encoding="utf-8")
api = (base / "app/api/consultation/route.ts").read_text(encoding="utf-8")
checks = {
    "AGI detail public BrandAwareLink": 'from "@/components/BrandAwareLink"' in agi,
    "AGI detail no hardcoded prefixed anchors": 'href="/agiworks' not in agi,
    "AGI detail uses clean URL converter": 'return resolveBrandNavHref(path, "agiworks");' in agi,
    "Pricing uses public BrandAwareLink": 'from "@/components/BrandAwareLink"' in pricing,
    "Pricing has no local-path prefix": 'const prefix =' not in pricing,
    "Booking uses one shared resource": 'shared-consultation-team' in slots,
    "Database enforces a single active resource slot":
        'CREATE UNIQUE INDEX IF NOT EXISTS uq_consultation_active_resource_slot' in (base / "lib/db/migrations/0017_shared_consultation_booking.ts").read_text(encoding="utf-8"),
    "Booking brand is checked against production host": 'req.nextUrl.hostname.toLowerCase()' in api,
    "Booking attribution is server resolved": 'resolveAttribution({' in api,
    "Admin booking feed is authenticated":
        'await verifySession()' in (base / "app/api/admin/consultations/route.ts").read_text(encoding="utf-8"),
    "Email sender never falls back to an unverified domain":
        'BOOKING_FROM_EMAIL' in (base / "lib/consultations/notifications.ts").read_text(encoding="utf-8") and
        'onboarding@resend.dev' not in (base / "lib/consultations/notifications.ts").read_text(encoding="utf-8"),
    "Booking requires privacy acknowledgement": 'privacyAcknowledged !== true' in api,
    "Booking persists via shared store": 'createBooking(' in api,
    "Both brands register /beratung": 'path: "/beratung"' in registry,
    "Brand-specific page is present": (base / "app/agiworks/beratung/page.tsx").is_file() and (base / "app/beratung/page.tsx").is_file(),
    "DB migration is registered": 'migration0017,' in (base / "lib/db/migrations/index.ts").read_text(encoding="utf-8"),
}
for name, passed in checks.items():
    print(("PASS" if passed else "FAIL") + ": " + name)
if not all(checks.values()):
    raise SystemExit("BOOKING_BRAND_GATE: FAIL")
print("BOOKING_BRAND_GATE: PASS")
