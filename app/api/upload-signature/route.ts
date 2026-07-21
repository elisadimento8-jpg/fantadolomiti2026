import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Credenziali Cloudinary mancanti." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const challengeId =
      typeof body.challengeId === "string"
        ? body.challengeId.replace(/[^a-zA-Z0-9_-]/g, "-")
        : "prova-sconosciuta";

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `fantadolomiti/prove/${challengeId}`;

    const signature = cloudinary.utils.api_sign_request(
      {
        folder,
        timestamp,
      },
      apiSecret
    );

    return NextResponse.json({
      signature,
      timestamp,
      folder,
      cloudName,
      apiKey,
    });
  } catch (error) {
    console.error("Errore generazione firma Cloudinary:", error);

    return NextResponse.json(
      { error: "Impossibile preparare il caricamento." },
      { status: 500 }
    );
  }
}