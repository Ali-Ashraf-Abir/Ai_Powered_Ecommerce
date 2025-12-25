// types/index.ts

export interface User {
  _id: string;
  id?: string;
  email: string;
  name: string;
  phone?: string;
  stylePreferences?: string;
  sizePreferences?: {
    tops?: string;
    pants?: string;
    shoes?: string;
  };
  lastLogin?: Date;
  totalOrders?: number;
  favoriteCategories?: string[];
  wishlist?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images?: string[];
  sizes?: string[];
  colors?: string[];
  material?: string;
  brand?: string;
  stockQuantity: number;
  isActive?: boolean;
  isFeatured?: boolean;
  analytics?: {
    viewCount?: number;
    purchaseCount?: number;
    cartAddCount?: number;
    averageRating?: number;
    reviewCount?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  _id: string;
  userId: string;
  productId: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  productId: string | Product;
  productSnapshot?: Product;
  quantity: number;
  price: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatLog {
  _id: string;
  userId: string;
  sessionId: string;
  message: string;
  response: string;
  context?: any;
  userSatisfaction?: number;
  createdAt: string;
}

export interface Review {
  _id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  reviewText?: string;
  purchasedSize?: string;
  fitFeedback?: string;
  isApproved?: boolean;
  createdAt: string;
  updatedAt?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
}

export interface ProductsResponse {
  success: boolean;
  products: Product[];
  count: number;
  total?: number;
}

export interface ProductResponse {
  success: boolean;
  product: Product;
}

export interface CartResponse {
  success: boolean;
  cartItems: CartItem[];
  count: number;
}

export interface CartItemResponse {
  success: boolean;
  cartItem: CartItem;
}

export interface OrdersResponse {
  success: boolean;
  orders: Order[];
  count: number;
}

export interface OrderResponse {
  success: boolean;
  order: Order;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  sessionId: string;
  suggestions?: string[];
}

export interface CategoriesResponse {
  success: boolean;
  categories: string[];
}

// Filter and Query Types
export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface AddToCartData {
  productId: string;
  quantity?: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface UpdateCartData {
  quantity: number;
}

export interface CreateOrderData {
  shippingAddress: ShippingAddress;
  paymentMethod: string;
}

export interface ChatMessageData {
  message: string;
  conversationHistory?: ChatMessage[];
}