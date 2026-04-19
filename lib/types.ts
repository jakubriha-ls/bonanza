export interface BookingData {
  terminFrom: string;       // ISO date string YYYY-MM-DD
  terminTo: string;         // ISO date string YYYY-MM-DD
  bookie: string;
  projectCountry: string;
  usecase: "Legacy bookie" | "New bookie" | "Affil + fix" | "Fix only";
  worldCup2026: boolean;
  headline: string;
  description: string;
  ctaButtonText: string;
  iosTrackingId: string;
  andTrackingId: string;
  iosLink: string;
  andLink: string;
  imageUrl: string;         // Google Drive URL or empty string
  notes: string;
}
