import { google } from "googleapis";
import { getGoogleAuth } from "./googleAuth";
import type { BookingData } from "./types";

export async function saveBooking(data: BookingData): Promise<void> {
  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const timestamp = new Date().toISOString();

  const row = [
    timestamp,
    `${data.terminFrom} – ${data.terminTo}`,
    data.bookie,
    data.projectCountry,
    data.usecase,
    data.worldCup2026 ? "TRUE" : "FALSE",
    data.headline,
    data.description,
    data.ctaButtonText,
    data.iosTrackingId,
    data.andTrackingId,
    data.iosLink,
    data.andLink,
    data.imageUrl,
    "To-Do",
    data.notes,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "form!A:O",
    valueInputOption: "RAW",
    requestBody: {
      values: [row],
    },
  });
}
