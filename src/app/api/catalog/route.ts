import { NextResponse } from "next/server";
import { listCatalogEntries } from "@/lib/repositories/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const entries = await listCatalogEntries();

    return NextResponse.json({
      success: true,
      entries: entries.map((entry) => ({
        id: entry.id,
        name: entry.name,
        colorName: entry.colorName,
        colorHex: entry.colorHex,
        rainbowBand: entry.rainbowBand,
        type: entry.type,
      })),
    });
  } catch (error) {
    console.error("Catalog route failed:", error);
    return NextResponse.json({ success: false, message: "Failed to load catalog." }, { status: 500 });
  }
}
