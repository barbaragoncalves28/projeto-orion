export interface DashboardData {
  totalRevenue: number;
  averageTicket: number;
  avgDeliveryTime: number;
  ordersPerDay: {
    date: string;
    total: number;
  }[];
  topProducts: {
    productId: string;
    name: string;
    totalSold: number;
  }[];
  ordersByStatus: {
    status: string;
    total: number;
  }[];
}