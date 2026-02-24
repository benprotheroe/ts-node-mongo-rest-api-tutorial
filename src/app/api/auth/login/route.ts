import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/repositories/users";
import { loginSchema } from "@/lib/validation/auth";
import { createSessionToken, setSessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid payload." }, { status: 400 });
    }

    const user = await getUserByEmail(parsed.data.email);
    if (!user) {
      return NextResponse.json({ success: false, message: "Invalid email or password." }, { status: 401 });
    }

    const isValid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ success: false, message: "Invalid email or password." }, { status: 401 });
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
    };

    const token = await createSessionToken(safeUser);
    await setSessionCookie(token);

    return NextResponse.json({ success: true, user: safeUser });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to log in." }, { status: 500 });
  }
}
