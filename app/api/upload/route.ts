import { v2 as cloudinary } from "cloudinary";
import type {
  UploadApiErrorResponse,
  UploadApiResponse,
} from "cloudinary";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (
        error: UploadApiErrorResponse | undefined,
        result: UploadApiResponse | undefined
      ) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary non ha restituito un risultato."));
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export async function POST(request: Request) {
    console.log("CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API_KEY:", process.env.CLOUDINARY_API_KEY);
console.log("SECRET PRESENT:", !!process.env.CLOUDINARY_API_SECRET);
  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        { error: "Credenziali Cloudinary mancanti." },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    const file = formData.get("file");
    const challengeIdValue = formData.get("challengeId");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Nessun file ricevuto." },
        { status: 400 }
      );
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Sono consentiti soltanto foto e video." },
        { status: 400 }
      );
    }

    const maximumSize = isImage
      ? 10 * 1024 * 1024
      : 100 * 1024 * 1024;

    if (file.size > maximumSize) {
      return NextResponse.json(
        {
          error: isImage
            ? "La foto supera il limite di 10 MB."
            : "Il video supera il limite di 100 MB.",
        },
        { status: 400 }
      );
    }

    const challengeId =
      typeof challengeIdValue === "string"
        ? challengeIdValue.replace(/[^a-zA-Z0-9_-]/g, "-")
        : "prova-sconosciuta";

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const result = await uploadToCloudinary(
      fileBuffer,
      `fantadolomiti/prove/${challengeId}`
    );

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      bytes: result.bytes,
      format: result.format,
    });
  } catch (error) {
    console.error("Errore upload Cloudinary:", error);

    return NextResponse.json(
      { error: "Caricamento non riuscito." },
      { status: 500 }
    );
  }
}