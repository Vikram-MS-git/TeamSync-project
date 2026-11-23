// src/config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export function uploadStream(buffer, folder = "collabboard_avatars") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [{ width: 300, height: 300, crop: "fill", gravity: "face" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export function uploadDocumentStream(buffer, originalFilename = "document", folder = "teamsync_attachments") {
  if (isCloudinaryConfigured()) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            size: result.bytes,
          });
        }
      );
      stream.end(buffer);
    });
  }

  // Graceful local disk fallback if Cloudinary is not configured in local environment
  const uploadDir = path.resolve(process.cwd(), "uploads", "attachments");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const ext = path.extname(originalFilename);
  const safeBase = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safeBase}${ext}`;
  const filePath = path.join(uploadDir, uniqueName);
  fs.writeFileSync(filePath, buffer);

  return Promise.resolve({
    url: `/uploads/attachments/${uniqueName}`,
    publicId: uniqueName,
    size: buffer.length,
    isLocal: true,
  });
}

export default cloudinary;
