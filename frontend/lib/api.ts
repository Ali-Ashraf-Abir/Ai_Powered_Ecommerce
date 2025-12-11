// lib/api.ts
import type {
  AuthResponse,
  ProductsResponse,
  ProductResponse,
  CartResponse,
  CartItemResponse,
  OrdersResponse,
  OrderResponse,
  ChatResponse,
  CategoriesResponse,
  ProductFilters,
  AddToCartData,
  UpdateCartData,
  CreateOrderData,
  ChatMessageData,
  ApiResponse,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      return data as T;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(userData: {
    email: string;
    password: string;
    name: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getMe(): Promise<{ success: boolean; user: any }> {
    return this.request('/auth/me');
  }

  // Product endpoints
  async getProducts(params: ProductFilters = {}): Promise<ProductsResponse> {
    const queryString = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return this.request<ProductsResponse>(
      `/products${queryString ? `?${queryString}` : ''}`
    );
  }

  async getProductById(id: string): Promise<ProductResponse> {
    return this.request<ProductResponse>(`/products/${id}`);
  }

  async getFeaturedProducts(): Promise<ProductsResponse> {
    return this.request<ProductsResponse>('/products/featured');
  }

  async getCategories(): Promise<CategoriesResponse> {
    return this.request<CategoriesResponse>('/products/categories');
  }

  // Cart endpoints
  async getCart(): Promise<CartResponse> {
    return this.request<CartResponse>('/cart');
  }

  async addToCart(data: AddToCartData): Promise<CartItemResponse> {
    return this.request<CartItemResponse>('/cart', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCartItem(
    id: string,
    data: UpdateCartData
  ): Promise<CartItemResponse> {
    return this.request<CartItemResponse>(`/cart/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async removeFromCart(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/cart/${id}`, {
      method: 'DELETE',
    });
  }

  async clearCart(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/cart', {
      method: 'DELETE',
    });
  }

  // Order endpoints
  async createOrder(data: CreateOrderData): Promise<OrderResponse> {
    return this.request<OrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrders(): Promise<OrdersResponse> {
    return this.request<OrdersResponse>('/orders');
  }

  async getOrderById(id: string): Promise<OrderResponse> {
    return this.request<OrderResponse>(`/orders/${id}`);
  }

  // Chat endpoints
  async sendChatMessage(data: ChatMessageData): Promise<ChatResponse> {
    return this.request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getChatHistory(params: {
    sessionId?: string;
    limit?: number;
  } = {}): Promise<any> {
    const queryString = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return this.request(
      `/chat/history${queryString ? `?${queryString}` : ''}`
    );
  }

  // Review endpoints
  async getProductReviews(productId: string): Promise<any> {
    return this.request(`/products/${productId}/reviews`);
  }

  async createReview(
    productId: string,
    data: {
      rating: number;
      title?: string;
      reviewText?: string;
      purchasedSize?: string;
      fitFeedback?: string;
    }
  ): Promise<any> {
    return this.request(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
export default api;