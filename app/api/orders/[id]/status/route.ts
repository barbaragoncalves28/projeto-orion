import type { NextRequest } from "next/server";
import { updateOrderStatusController } from "@/modules/orders/order.controller";

console.log("STATUS ROUTE CARREGADA");

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  console.log("PATCH STATUS CHAMADO");

  const { id } = await ctx.params;

  return updateOrderStatusController(req, id);
}
