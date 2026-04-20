// Імпортуємо mongoose для роботи з MongoDB та тип Document для TypeScript
import mongoose, { Document } from "mongoose";

// Інтерфейс описує структуру одного товару в TypeScript
export interface IProduct extends Document {
  title: string; // Назва товару
  description: string; // Детальний опис
  price: number; // Ціна в гривнях
  category: string; // Категорія (телефони, ноутбуки тощо)
  images: string[]; // Масив URL зображень (Cloudinary або S3)
  stock: number; // Кількість одиниць на складі
  sellerId: mongoose.Types.ObjectId; // Посилання на юзера який продає товар
  rating: number; // Середній рейтинг з відгуків
  reviewsCount: number; // Кількість відгуків
  isActive: boolean; // Чи відображається товар у каталозі
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new mongoose.Schema<IProduct>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200, // Обмеження довжини назви
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000, // Детальний опис може бути довгим
    },
    price: {
      type: Number,
      required: true,
      min: 0, // Ціна не може бути від'ємною
    },
    category: {
      type: String,
      required: true,
      // Фіксований список категорій маркетплейсу
      enum: [
        "phones",
        "laptops",
        "tablets",
        "accessories",
        "audio",
        "cameras",
        "other",
      ],
    },
    images: {
      type: [String], // Масив рядків (URL зображень)
      default: [], // За замовчуванням порожній масив
    },
    stock: {
      type: Number,
      required: true,
      min: 0, // Не може бути від'ємним
      default: 0,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Вказує що це посилання на колекцію users (для populate())
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5, // Рейтинг від 0 до 5
    },
    reviewsCount: {
      type: Number,
      default: 0, // При створенні товару відгуків ще немає
    },
    isActive: {
      type: Boolean,
      default: true, // Новий товар одразу відображається в каталозі
    },
  },
  {
    timestamps: true, // Автоматично додає createdAt і updatedAt
  },
);

// Індекси для пришвидшення пошуку та фільтрації
// Без індексів MongoDB сканує всі документи — це повільно при великій кількості товарів
productSchema.index({ title: "text", description: "text" }); // Повнотекстовий пошук
productSchema.index({ category: 1 }); // Швидка фільтрація по категорії
productSchema.index({ price: 1 }); // Швидке сортування по ціні
productSchema.index({ sellerId: 1 }); // Швидкий пошук товарів продавця

export default mongoose.model<IProduct>("Product", productSchema);
