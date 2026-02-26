import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { listItemsByUser } from "@/lib/repositories/items";
import { listCatalogEntries } from "@/lib/repositories/catalog";
import { buildInsights } from "@/lib/services/insights";

export const dynamic = "force-dynamic";

function parseWindowDays(request: NextRequest) {
  const value = request.nextUrl.searchParams.get("window");
  if (!value) {
    return 30;
  }

  if (value === "7d") {
    return 7;
  }

  return 30;
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ success: false, message: "Not authenticated." }, { status: 401 });
  }

  try {
    const [items, catalog] = await Promise.all([listItemsByUser(user.id), listCatalogEntries()]);
    const windowDays = parseWindowDays(request);
    const insights = buildInsights({ items, catalog, windowDays });
    return NextResponse.json({ success: true, insights });
  } catch (error) {
    console.error("Insights route failed:", error);
    return NextResponse.json({ success: false, message: "Failed to build insights." }, { status: 500 });
  }
}
