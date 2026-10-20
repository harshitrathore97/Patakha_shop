export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  imageUrl: string;
  imagePublicId: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  delivery: string;
  address: string;
}

export interface ShopConfig {
  _id: string;
  shopName: string;
  whatsappNumber: string;
  tagline: string;
  categories: string[];
  deliveryOptions: string[];
  footerText: string;
  announcementBanner: string;
  isStoreOpen: boolean;
}

export interface Admin {
  id: string;
  email: string;
  role: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface ProductsResponse {
  success: boolean;
  products: Product[];
  total: number;
  page: number;
  pages: number;
}

export interface ValidatedOrderItem {
  productId: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  subtotal: number;
}

export interface OrderValidationResponse {
  success: boolean;
  items: ValidatedOrderItem[];
  total: number;
  message?: string;
}
