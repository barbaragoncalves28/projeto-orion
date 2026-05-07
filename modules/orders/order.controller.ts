import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";
import { getUserFromRequest } from "@/lib/getUser";
import {
  cancelOrderSchema,
  createOrderSchema,
  formatZodError,
  getOrderByIdSchema,
  listOrdersSchema,
  updateOrderStatusSchema,
} from "./order.validators";
import {
  cancelOrderService,
  createOrderService,
  getOrderByIdService,
  listOrdersService,
  updateOrderStatusService,
} from "./order.service";

function apiError(error: unknown) {
  console.error("ERRO COMPLETO:", error);

  if (error instanceof Error && error.message === "Não autenticado") {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof AppError) {
    const status =
      error.statusCode === 404 || error.statusCode === 403
        ? error.statusCode
        : 400;

    return NextResponse.json(
      { error: error.message },
      { status }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Payload inválido", details: formatZodError(error) },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: "Erro desconhecido" }, { status: 500 });
}

export async function createOrderController(req: NextRequest) {
  try {
    const user = await getUserFromRequest();
    const body = await req.json();
    const parsed = createOrderSchema.parse(body);
    const input = {
      ...parsed,
      userId: user.id,
    };
    const order = await createOrderService(input);

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function listOrdersController(req: NextRequest) {
  try {
    const user = await getUserFromRequest();
    const { searchParams } = new URL(req.url);
    const input = listOrdersSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      status: searchParams.get("status") ?? undefined,
    });

    const orders = await listOrdersService({
      ...input,
      userId: user.id,
    });

    return NextResponse.json(orders);
  } catch (error) {
    return apiError(error);
  }
}

export async function getOrderByIdController(
  req: NextRequest,
  orderId: string
) {
  try {
    const user = await getUserFromRequest();
    const parsed = getOrderByIdSchema.parse({
      orderId,
    });

    const order = await getOrderByIdService({
      ...parsed,
      userId: user.id,
      role: user.role,
    });

    return NextResponse.json(order);
  } catch (error) {
    return apiError(error);
  }
}

export async function updateOrderStatusController(
  req: NextRequest,
  orderId: string
) {
  try {
    const user = await getUserFromRequest();
    const body = await req.json();

    const parsed = updateOrderStatusSchema.parse({
      orderId,
      userId: user.id,
      role: user.role,
      newStatus: body.newStatus,
    });

    const order = await updateOrderStatusService(parsed);

    return NextResponse.json(order);
  } catch (error) {
    return apiError(error);
  }
}

export async function cancelOrderController(req: NextRequest, orderId: string) {
  try {
    const user = await getUserFromRequest();
    const parsed = cancelOrderSchema.parse({
      orderId,
    });

    const order = await cancelOrderService({
      ...parsed,
      userId: user.id,
      role: user.role,
    });

    return NextResponse.json(order);
  } catch (error) {
    return apiError(error);
  }
}
