import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getDemoRequests, updateDemoRequest, deleteDemoRequest } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = getDemoRequests();
    const { searchParams } = new URL(request.url);
    const archived = searchParams.get("archived") === "true";
    const unread = searchParams.get("unread") === "true";
    const status = searchParams.get("status");

    let filtered = requests;
    if (archived) {
      filtered = filtered.filter((r) => r.archived);
    } else {
      filtered = filtered.filter((r) => !r.archived);
    }
    if (unread) {
      filtered = filtered.filter((r) => !r.read);
    }
    if (status) {
      filtered = filtered.filter((r) => r.status === status);
    }

    // Sort by newest first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ requests: filtered });
  } catch (error) {
    console.error("Error fetching demo requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch demo requests" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updated = updateDemoRequest(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Demo request not found" }, { status: 404 });
    }

    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error("Error updating demo request:", error);
    return NextResponse.json(
      { error: "Failed to update demo request" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const deleted = deleteDemoRequest(id);
    if (!deleted) {
      return NextResponse.json({ error: "Demo request not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting demo request:", error);
    return NextResponse.json(
      { error: "Failed to delete demo request" },
      { status: 500 }
    );
  }
}

