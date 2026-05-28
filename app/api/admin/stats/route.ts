import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getSnapshot, type AnalyticsBrand } from "@/lib/analytics-store";
import { getAllPosts } from "@/lib/contact-store";
import { getDemoRequests } from "@/lib/database";

export const dynamic = "force-dynamic";

function parseBrand(input: string | null): AnalyticsBrand | "all" {
  if (input === "agiworks" || input === "nexcel") return input;
  return "all";
}

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brand = parseBrand(searchParams.get("brand"));

    const snapshot = await getSnapshot(brand);

    // Contact + demo aggregates so the existing dashboard KPIs stay populated.
    const allContacts = getAllPosts();
    const contacts = (allContacts as any[]).filter((c) => {
      if (brand === "all") return true;
      return (c.brand ?? "nexcel") === brand;
    });
    const demoRequests = getDemoRequests();
    const unreadContacts = contacts.filter((c: any) => !c.read && !c.archived).length;
    const unreadDemoRequests = demoRequests.filter((r) => !r.read && !r.archived).length;
    const pendingDemoRequests = demoRequests.filter(
      (r) => r.status === "pending" && !r.archived,
    ).length;

    // Bridge: top pages adapted for legacy KPI cards.
    const topPages = snapshot.topPages
      .map((p) => ({ page: p.page, count: p.views }))
      .slice(0, 10);

    return NextResponse.json(
      {
        analytics: {
          total: {
            pageViews: snapshot.totals.pageViews,
            contacts: contacts.length,
            demoRequests: demoRequests.length,
            sessions: snapshot.totals.sessions,
            visitors: snapshot.totals.visitors,
            pricingStarts: snapshot.totals.pricingStarts,
            pricingQuotes: snapshot.totals.pricingQuotes,
            pricingSubmits: snapshot.totals.pricingSubmits,
            uploads: snapshot.totals.uploads,
            events: snapshot.totals.events,
          },
          last24h: snapshot.buckets.last24h,
          last7d: snapshot.buckets.last7d,
          last30d: snapshot.buckets.last30d,
          topPages,
          live: { visitors: snapshot.liveVisitors },
          funnel: snapshot.funnel,
          topReferrers: snapshot.topReferrers,
          deviceMix: snapshot.deviceMix,
          brandSplit: snapshot.brandSplit,
          scrollDepthHistogram: snapshot.scrollDepthHistogram,
          topPagesDetailed: snapshot.topPages,
          recentSessions: snapshot.recentSessions,
          recentEvents: snapshot.recentEvents,
        },
        contacts: {
          total: contacts.length,
          unread: unreadContacts,
          archived: contacts.filter((c: any) => c.archived).length,
        },
        demoRequests: {
          total: demoRequests.length,
          unread: unreadDemoRequests,
          pending: pendingDemoRequests,
          archived: demoRequests.filter((r) => r.archived).length,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
