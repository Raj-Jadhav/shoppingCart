export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  formatted_price: string;
  image_url: string | null;
  in_stock: boolean;
  stock_quantity: number;
}

export interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: string;
    formatted_price: string;
    image_url: string | null;
    stock_quantity: number;
  };
  quantity: number;
  subtotal: string;
  formatted_subtotal: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  item_count: number;
  total_quantity: number;
  total: string;
  formatted_total: string;
}

export interface Order {
  id: number;
  status: string;
  total_amount: string;
  formatted_total: string;
  amount_paid: string;
  formatted_paid: string;
  change_amount: string;
  formatted_change: string;
  total_items: number;
  created_at: string;
  completed_at: string | null;
}