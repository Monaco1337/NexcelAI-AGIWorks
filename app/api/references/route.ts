import { NextResponse } from "next/server";
import { getPublishedReferences } from "@/lib/references-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const refs = await getPublishedReferences();
    return NextResponse.json({ references: refs });
  } catch {
    return NextResponse.json({ references: [] });
  }
}
