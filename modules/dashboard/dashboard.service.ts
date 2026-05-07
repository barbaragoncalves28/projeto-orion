import {
  getTotalRevenue,
  getAverageTicket,
  getOrdersPerDay,
  getTopProducts,
  getAverageDeliveryTime,
} from "./dashboard.repository";

export async function getDashboardData() {
  const [
    totalRevenue,
    averageTicket,
    ordersPerDay,
    topProducts,
    avgDeliveryTime,
  ] = await Promise.all([
    getTotalRevenue(),
    getAverageTicket(),
    getOrdersPerDay(),
    getTopProducts(),
    getAverageDeliveryTime(),
  ]);

  return {
    totalRevenue,
    averageTicket,
    ordersPerDay,
    topProducts,
    avgDeliveryTime,
  };
}

let cache: any = null;
let lastFetch = 0;

export async function getDashboardData() {
  const now = Date.now();

  if (cache && now - lastFetch < 30000) {
    return cache;
  }

  const data = await fetchData();

  cache = data;
  lastFetch = now;

  return data;
}