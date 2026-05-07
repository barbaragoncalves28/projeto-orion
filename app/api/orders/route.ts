import type { NextRequest } from "next/server";
import {
  createOrderController,
  listOrdersController,
} from "@/modules/orders/order.controller";

export async function POST(req: NextRequest) {
  return createOrderController(req);
}

export async function GET(req: NextRequest) {
  return listOrdersController(req);
}
