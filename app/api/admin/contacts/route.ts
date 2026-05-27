import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getAllPosts, updatePost, deletePost } from "@/lib/contact-store";

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const archived = searchParams.get("archived") === "true";
    const unread = searchParams.get("unread") === "true";

    // Lade alle Posts aus Contact-Store
    let contacts = getAllPosts();
    
    // Filtere nach archived/unread
    if (archived) {
      contacts = contacts.filter(c => c.archived);
    } else {
      contacts = contacts.filter(c => !c.archived);
    }
    
    if (unread) {
      contacts = contacts.filter(c => !c.read);
    }

    // Transform contacts to match AdminDashboard interface
    const transformedContacts = contacts.map((contact) => ({
      id: contact.id,
      name: `${contact.vorname} ${contact.nachname}`,
      email: contact.email,
      telefon: contact.telefon || undefined,
      unternehmen: contact.unternehmen || undefined,
      betreff: contact.betreff,
      nachricht: contact.nachricht,
      createdAt: contact.createdAt,
      read: contact.read,
      archived: contact.archived,
    }));

    return NextResponse.json({ contacts: transformedContacts }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
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

    // Update post in Contact-Store
    const updated = updatePost(id, {
      read: updates.read,
      archived: updates.archived,
      status: updates.status,
    });

    if (!updated) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({
      contact: {
        id: updated.id,
        name: `${updated.vorname} ${updated.nachname}`,
        email: updated.email,
        telefon: updated.telefon || undefined,
        unternehmen: updated.unternehmen || undefined,
        betreff: updated.betreff,
        nachricht: updated.nachricht,
        createdAt: updated.createdAt,
        read: updated.read,
        archived: updated.archived,
      },
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
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

    // Delete post from Contact-Store
    const success = deletePost(id);

    if (!success) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
