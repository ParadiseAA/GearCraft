import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import authRoutes from "./routes/auth";
import mediaRoutes from "./routes/media";
import orderRoutes from "./routes/orders";
import productRoutes from "./routes/products";
import shopRoutes from "./routes/shop";

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/upload", mediaRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/shop", shopRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running!" });
});

app.use("/api/products", productRoutes);

app.use((err: unknown, req: any, res: any, next: any) => {
  const error = err as Error & { name?: string };

  if (error.name === "MulterError") {
    return res.status(400).json({ message: error.message });
  }

  if (error instanceof Error) {
    return res.status(400).json({ message: error.message });
  }

  next(err);
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
};

start();
