import { Response } from "express";
import { UploadApiResponse } from "cloudinary";
import cloudinary from "../config/cloudinary";
import { AuthenticatedRequest } from "../middleware/auth";

const uploadBufferToCloudinary = (file: Express.Multer.File) => {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "ecom-products",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve(result);
      },
    );

    stream.end(file.buffer);
  });
};

export const uploadImage = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "Image file is required" });
  }

  const result = await uploadBufferToCloudinary(req.file);

  res.status(201).json({
    url: result.secure_url,
  });
};
