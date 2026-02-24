import { NextRequest, NextResponse } from "next/server";
import { createItem, listItemsByUser } from "@/lib/repositories/items";
import { createItemSchema } from "@/lib/validation/items";
import { getAuthenticatedUser } from "@/lib/auth";
import { getCatalogEntryByName } from "@/lib/repositories/catalog";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ success: false, message: "Not authenticated." }, { status: 401 });
  }

  const items = await listItemsByUser(user.id);

  return NextResponse.json({
    success: true,
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      colorName: item.colorName,
      colorHex: item.colorHex,
      rainbowBand: item.rainbowBand,
      createdAt: item.createdAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ success: false, message: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Invalid payload." }, { status: 400 });
  }

  const catalogMatch = await getCatalogEntryByName(parsed.data.name);

  const resolvedColorName = catalogMatch?.colorName ?? parsed.data.colorName;
  const resolvedColorHex = catalogMatch?.colorHex ?? parsed.data.colorHex;
  const resolvedBand = catalogMatch?.rainbowBand ?? parsed.data.rainbowBand;

  if (!resolvedColorName || !resolvedColorHex || !resolvedBand) {
    return NextResponse.json(
      {
        success: false,
        message: "Color name, color code, and rainbow band are required for items not in the catalog.",
      },
      { status: 400 }
    );
  }

  const item = await createItem({
    name: parsed.data.name,
    colorName: resolvedColorName,
    colorHex: resolvedColorHex,
    rainbowBand: resolvedBand,
    userId: user.id,
  });

  return NextResponse.json(
    {
      success: true,
      item: {
        id: item.id,
        name: item.name,
        colorName: item.colorName,
        colorHex: item.colorHex,
        rainbowBand: item.rainbowBand,
        createdAt: item.createdAt,
      },
    },
    { status: 201 }
  );
}
