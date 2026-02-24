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
      color: item.color ?? "Unknown",
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
  const resolvedColor = catalogMatch?.color ?? parsed.data.color;

  if (!resolvedColor) {
    return NextResponse.json(
      {
        success: false,
        message: "Color is required for items not in the fruit and veg catalog.",
      },
      { status: 400 }
    );
  }

  const item = await createItem({
    name: parsed.data.name,
    color: resolvedColor,
    userId: user.id,
  });

  return NextResponse.json(
    {
      success: true,
      item: {
        id: item.id,
        name: item.name,
        color: item.color,
        createdAt: item.createdAt,
      },
    },
    { status: 201 }
  );
}
