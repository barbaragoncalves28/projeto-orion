export interface DashboardData {
  totalRevenue: number;
  averageTicket: number;
  ordersPerDay: {
    date: string;
    total: number;
  }[];
  topProducts: {
    productId: string;
    name: string;
    totalSold: number;
  }[];
}