import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  const expectedHash = hashPassword(process.env.FORM_PASSWORD || "");
  const providedHash = hashPassword(password || "");

  if (providedHash !== expectedHash) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("fs_auth", expectedHash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
