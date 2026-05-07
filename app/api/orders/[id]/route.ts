import type { NextRequest } from "next/server";
import { getOrderByIdController } from "@/modules/orders/order.controller";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  return getOrderByIdController(req, id);
}
