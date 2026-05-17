import {
  getTotalRevenue,
  getAverageTicket,
  getOrdersPerDay,
  getTopProducts,
  getAverageDeliveryTime,
  getOrdersByStatus,
  getOrdersByPaymentMethod,
} from "./dashboard.repository";

let cache: any = null;
let lastFetch = 0;

async function fetchDashboardData() {
  const [
    totalRevenue,
    averageTicket,
    ordersPerDay,
    topProducts,
    avgDeliveryTime,
    ordersByStatus,
    ordersByPaymentMethod,
  ] = await Promise.all([
    getTotalRevenue(),
    getAverageTicket(),
    getOrdersPerDay(),
    getTopProducts(),
    getAverageDeliveryTime(),
    getOrdersByStatus(),
    getOrdersByPaymentMethod(),
  ]);

  return {
    totalRevenue,
    averageTicket,
    ordersPerDay,
    topProducts,
    avgDeliveryTime,
    ordersByStatus,
    ordersByPaymentMethod,
  };
}

export async function getDashboardData() {
  const now = Date.now();

  if (cache && now - lastFetch < 30000) {
    return cache; 
  }

  const data = await fetchDashboardData();

  cache = data;
  lastFetch = now;

  return data;
}