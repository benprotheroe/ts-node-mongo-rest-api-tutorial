import { NextResponse } from "next/server";
import { listCatalogEntries } from "@/lib/repositories/catalog";

export async function GET() {
  try {
    const entries = await listCatalogEntries();

    return NextResponse.json({
      success: true,
      entries: entries.map((entry) => ({
        id: entry.id,
        name: entry.name,
        color: entry.color,
        type: entry.type,
      })),
    });
  } catch (error) {
    console.error("Catalog route failed:", error);
    return NextResponse.json({ success: false, message: "Failed to load catalog." }, { status: 500 });
  }
}
