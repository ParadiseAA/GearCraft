import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  deleteProductReview,
  findReviewsByProductId,
  upsertProductReview,
} from "../models/Review";

export const getProductReviews = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const reviews = await findReviewsByProductId(String(req.params.id));

  res.json(reviews);
};

export const createProductReview = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const rating = Number(req.body.rating);
  const comment = String(req.body.comment ?? "").trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be from 1 to 5" });
  }

  if (!comment || comment.length > 1000) {
    return res
      .status(400)
      .json({ message: "Comment is required and must be up to 1000 characters" });
  }

  try {
    const result = await upsertProductReview({
      productId: String(req.params.id),
      userId: req.user!.id,
      rating,
      comment,
    });

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Product not found") {
      return res.status(404).json({ message: "Product not found" });
    }

    throw error;
  }
};

export const deleteReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await deleteProductReview({
      productId: String(req.params.id),
      reviewId: String(req.params.reviewId),
    });

    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Review not found") {
      return res.status(404).json({ message: "Review not found" });
    }

    throw error;
  }
};
