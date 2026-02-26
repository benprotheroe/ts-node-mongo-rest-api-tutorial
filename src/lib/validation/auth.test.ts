import { loginSchema, registerSchema } from "@/lib/validation/auth";

describe("auth validation", () => {
  it("accepts valid register payload", () => {
    const parsed = registerSchema.safeParse({
      email: "user@example.com",
      username: "Ben",
      password: "securepass123",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects register payload with short password", () => {
    const parsed = registerSchema.safeParse({
      email: "user@example.com",
      username: "Ben",
      password: "short",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects login payload with invalid email", () => {
    const parsed = loginSchema.safeParse({
      email: "invalid-email",
      password: "securepass123",
    });

    expect(parsed.success).toBe(false);
  });
});
