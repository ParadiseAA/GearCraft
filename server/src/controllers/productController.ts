import { Request, Response } from "express";
import Product from "../models/Product";
import { AuthenticatedRequest } from "../middleware/auth";

export const createProduct = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { title, description, price, category, stock } = req.body;

  const product = await Product.create({
    title,
    description,
    price,
    category,
    stock,
    sellerId: req.user!.id,
  });

  res.status(201).json(product);
};

export const getProducts = async (req: Request, res: Response) => {
  const products = await Product.find({ isActive: true });
  res.json(products);
};

export const getProductById = async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id).populate(
    "sellerId",
    "name email",
  );

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(product);
};
