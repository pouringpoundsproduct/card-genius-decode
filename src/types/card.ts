export interface CreditCard {
  id: string;
  name: string;
  nick_name?: string;
  slug: string;
  image?: string;
  bank_name: string;
  bank_id?: number;
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
  id: string;
  name: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface ApiResponse {
  cards: CreditCard[];
  banks: Bank[];
  tags: Tag[];
}
