// Cloudflare Bindings型定義
export type Bindings = {
  DB: D1Database
}

// ユーザー型
export type User = {
  id: number
  email: string
  shop_name: string
  shop_type: 'factory' | 'individual'
  postal_code?: string
  prefecture?: string
  city?: string
  address?: string
  phone?: string
  is_verified: boolean
  is_active: boolean
  rating: number
  total_sales: number
  total_purchases: number
  created_at: string
}

// カテゴリ型
export type Category = {
  id: number
  name: string
  slug: string
  icon?: string
  display_order: number
  is_active: boolean
}

export type Subcategory = {
  id: number
  category_id: number
  name: string
  slug: string
  display_order: number
  is_active: boolean
}

// メーカー・車種型
export type CarMaker = {
  id: number
  name: string
  name_en?: string
  display_order: number
  is_active: boolean
}

export type CarModel = {
  id: number
  maker_id: number
  name: string
  model_code?: string
  year_from?: number
  year_to?: number
  is_active: boolean
}

// 商品型
export type Product = {
  id: number
  seller_id: number
  title: string
  description: string
  price: number
  category_id: number
  subcategory_id?: number
  maker_id?: number
  model_id?: number
  part_number?: string
  compatible_models?: string
  condition: 'new' | 'like_new' | 'good' | 'acceptable'
  stock_quantity: number
  status: 'draft' | 'active' | 'sold' | 'suspended'
  is_proxy: boolean
  proxy_status?: string
  view_count: number
  favorite_count: number
  created_at: string
  updated_at: string
  sold_at?: string
}

export type ProductImage = {
  id: number
  product_id: number
  image_url: string
  image_key: string
  display_order: number
  created_at: string
}

// APIレスポンス型
export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type PaginatedResponse<T> = {
  items: T[]
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}
