export interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
  threshold: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AnalyticsData {
  summary: {
    totalValue: number;
    lowStockCount: number;
  };
  categoryDistribution: {
    category: string;
    count: number;
  }[];
  stockTrends: {
    date: string;
    netChange: number;
  }[];
  insights: {
    topLowStock: Product[];
    recentlyUpdated: Product[];
    deadStock: Product[];
  };
}
