import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getAnalyticsStats, getContacts, getDemoRequests } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const analytics = getAnalyticsStats();
    const contacts = await getContacts();
    const demoRequests = getDemoRequests(); // sync function

    const unreadContacts = contacts.filter((c) => !c.read && !c.archived).length;
    const unreadDemoRequests = demoRequests.filter((r) => !r.read && !r.archived).length;
    const pendingDemoRequests = demoRequests.filter((r) => r.status === "pending" && !r.archived).length;

    return NextResponse.json({
      analytics,
      contacts: {
        total: contacts.length,
        unread: unreadContacts,
        archived: contacts.filter((c) => c.archived).length,
      },
      demoRequests: {
        total: demoRequests.length,
        unread: unreadDemoRequests,
        pending: pendingDemoRequests,
        archived: demoRequests.filter((r) => r.archived).length,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

