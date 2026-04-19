import { NextRequest, NextResponse } from "next/server";
import { saveBooking } from "@/lib/storage";
import type { BookingData } from "@/lib/types";

export async function POST(request: NextRequest) {
  const data: BookingData = await request.json();

  // Basic validation of required fields
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

  await saveBooking(data);

  return NextResponse.json({ success: true });
}
