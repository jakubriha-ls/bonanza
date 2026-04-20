import { google } from "googleapis";
import { Readable } from "stream";
import { getGoogleAuth } from "./googleAuth";

export async function uploadFile(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const auth = getGoogleAuth();
  const drive = google.drive({ version: "v3", auth });

  const stream = Readable.from(fileBuffer);

  const uploadRes = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: "id",
    supportsAllDrives: true,
  });

  const fileId = uploadRes.data.id!;

  await drive.permissions.create({
    fileId,
    requestBody: {
      type: "anyone",
      role: "reader",
    },
    supportsAllDrives: true,
  });

  return `https://drive.google.com/uc?id=${fileId}`;
}
