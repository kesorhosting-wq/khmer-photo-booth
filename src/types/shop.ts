// Category function types
export type CategoryFunction = 'link' | 'account' | 'upload';

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  function_type: CategoryFunction;
}

export interface ProductAccount {
  id: string;
  product_id: string;
  account_details: string[];
  is_sold: boolean;
  sold_to_user_id: string | null;
  sold_at: string | null;
  created_at: string;
}

export interface ProductFile {
  id: string;
  product_id: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: {
    id: string;
    name: string;
    image_url: string;
    price: string | null;
    category_id: string | null;
  };
}

export interface Order {
  id: string;
  user_id: string;
  product_id: string;
  product_account_id: string | null;
  product_file_id: string | null;
  transaction_id: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    image_url: string;
    price: string | null;
  };
  product_account?: ProductAccount;
  product_file?: ProductFile;
}

export interface PaymentGateway {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  config: {
    node_api_url?: string;
    websocket_url?: string;
    webhook_secret?: string;
    bakong_account?: string;
  };
}
