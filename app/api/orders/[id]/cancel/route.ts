import type { NextRequest } from "next/server";
import { cancelOrderController } from "@/modules/orders/order.controller";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  return cancelOrderController(req, id);
}
