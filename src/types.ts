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

// 適合情報型
export type ProductCompatibility = {
  id: number
  product_id: number
  maker_id?: number
  model_id?: number
  year_from?: number
  year_to?: number
  model_code?: string
  grade?: string
  engine_type?: string
  drive_type?: string
  transmission_type?: string
  body_type?: string
  oem_part_number?: string
  aftermarket_part_number?: string
  alternative_numbers?: string
  verification_method?: 'actual_vehicle' | 'part_number' | 'catalog' | 'manual'
  fitment_notes?: string
  special_requirements?: string
  confidence_level: number
  verified_by_admin: boolean
  created_at: string
  updated_at: string
}

// ユーザー車両型
export type UserVehicle = {
  id: number
  user_id: number
  nickname: string
  maker_id: number
  model_id: number
  year: number
  model_code?: string
  grade?: string
  engine_type?: string
  drive_type?: string
  transmission_type?: string
  body_type?: string
  chassis_number_last4?: string
  registration_date?: string
  registration_image_url?: string
  is_primary: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  // JOIN用
  maker_name?: string
  model_name?: string
}

// 適合確認型
export type FitmentConfirmation = {
  id: number
  product_id: number
  user_id: number
  user_vehicle_id?: number
  fits: boolean
  fit_quality?: number
  installation_difficulty?: number
  notes?: string
  images?: string
  verified_by_admin: boolean
  helpful_count: number
  created_at: string
  // JOIN用
  user_name?: string
  vehicle_info?: string
}

// 汎用部品型
export type UniversalPart = {
  id: number
  product_id: number
  part_type?: string
  universal_category?: string
  thread_size?: string
  dimensions?: string
  specifications?: string
  compatible_makers?: string
  compatible_years?: string
  notes?: string
  created_at: string
}

// 適合マッチング結果型
export type FitmentMatch = {
  product_id: number
  confidence: number // 0-100
  match_type: 'exact' | 'high' | 'medium' | 'low'
  match_reasons: string[]
  compatibility_info?: ProductCompatibility
  user_confirmations?: number
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
