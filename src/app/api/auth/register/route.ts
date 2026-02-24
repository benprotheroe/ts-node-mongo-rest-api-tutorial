import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/lib/repositories/users";
import { registerSchema } from "@/lib/validation/auth";
import { createSessionToken, hashPassword, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid payload." }, { status: 400 });
    }

    const existingUser = await getUserByEmail(parsed.data.email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await createUser({
      email: parsed.data.email,
      username: parsed.data.username,
      passwordHash,
    });

    const safeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
    };

    const token = await createSessionToken(safeUser);
    await setSessionCookie(token);

    return NextResponse.json({ success: true, user: safeUser }, { status: 201 });
  } catch (error) {
    console.error("Register route failed:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          process.env.NODE_ENV === "development"
            ? `Failed to register: ${error instanceof Error ? error.message : "Unknown error"}`
            : "Failed to register.",
      },
      { status: 500 }
    );
  }
}
