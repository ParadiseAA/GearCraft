export interface Product {
  _id: string;
  id?: string;
  title: string;
  name?: string;
  description: string;
  descriptionUk?: string;
  descriptionEn?: string;
  price: number;
  image?: string;
  category: string;
  images: string[];
  stock: number;
  countInStock?: number;
  rating: number;
  reviewsCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}
