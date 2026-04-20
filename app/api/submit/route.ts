import { NextRequest, NextResponse } from "next/server";
import { saveBooking } from "@/lib/storage";
import type { BookingData } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  let data: BookingData;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const required: (keyof BookingData)[] = [
    "terminFrom",
    "terminTo",
    "bookie",
    "projectCountry",
    "usecase",
    "iosLink",
    "andLink",
  ];

  for (const field of required) {
    if (!data[field] && data[field] !== false) {
      return NextResponse.json(
        { error: `Missing required field: ${field}` },
        { status: 400 }
      );
    }
  }

  try {
    await saveBooking(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save booking";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
