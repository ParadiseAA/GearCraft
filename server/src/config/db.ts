import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`MongoDB підключено: ${conn.connection.host}`);
  } catch (error) {
    console.error("Помилка підключення до MongoDB:", error);
    process.exit(1);
  }
};

export default connectDB;
