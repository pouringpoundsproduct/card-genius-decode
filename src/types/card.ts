
export interface CreditCard {
  id: string;
  name: string;
  nick_name?: string;
  slug: string;
  image?: string;
  bank_name: string;
  bank_id?: string | number;
  joining_fee: number | string;
  annual_fee: number | string;
  welcome_offer?: string;
  apply_url?: string;
  tags?: string[];
  features?: string[];
  other_info?: string[];
  cashback_rate?: string | number;
  reward_rate?: string | number;
  lounge_access?: boolean;
  eligibility?: string[];
  relevanceScore?: number;
}

export interface Bank {
  id: string | number;
  name: string;
  logo?: string;
}

export interface Tag {
  id: string | number;
  name: string;
  slug?: string;
}

export interface ApiResponse {
  success: boolean;
  data: any;
  total_records?: number;
  current_page?: number;
  per_page?: number;
  has_more_pages?: boolean;
}
