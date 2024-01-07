export interface BetItem {
  bet_slip_id: BetSlipId;
  user_uuid: string;
  code: string;
  game_type: number;
  bet_type: number;
  bet_category: string;
  number: string[];
  amount: number;
  price: number;
  point: number;
  status: number;
  result: number;
  payout: number;
  extra_price_point: number;
  term: string;
  term_timestamp: number;
  ticket_id: number;
  source: string;
  created_at: number;
}

export interface BetSlipId {
  $oid: string;
}

export interface User {
  line: string;
  uuid: string;
  username: string;
  full_name: string;
  type: number;
  status: number;
  total_balance: number;
  available_balance: number;
  in_order_balance: number;
  created_at: number;
  last_login: number;
  level: number;
  children: User[];
  profit: number;
  companyCommission: number;
  adminCommission: number;
  superCommission: number;
  masterCommission: number;
  agentCommission: number;
  outstanding: number;
  bidPercent: number;
  bid: number;
  bidOutside: number;
  parent_uuid: string;
  parent: User;
}
