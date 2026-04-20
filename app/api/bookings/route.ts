import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { google } from "googleapis";
import { getGoogleAuth } from "@/lib/googleAuth";

export interface Booking {
  from: string;    // YYYY-MM-DD
  to: string;      // YYYY-MM-DD
  bookie: string;
  country: string;
  status: string;
}

export async function GET() {
  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "form!A2:P",
  });

  const rows = res.data.values ?? [];

  const bookings: Booking[] = rows
    .map((row) => {
      const dateStr: string = row[1] ?? "";
      const parts = dateStr.split("–").map((s: string) => s.trim());
      return {
        from: parts[0] ?? "",
        to: parts[1] ?? "",
        bookie: row[2] ?? "",
        country: row[3] ?? "",
        status: row[14] ?? "",
      };
    })
    .filter((b) => b.from && b.to && b.country);

  return NextResponse.json(bookings);
}
