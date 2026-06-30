import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/getUser";
import { processPendingOrderEvents } from "@/modules/orders/order-event.dispatcher";

// Invoked by Vercel Cron (GET). Vercel sends `Authorization: Bearer $CRON_SECRET`.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (
    !cronSecret ||
    req.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 401 });
  }

  try {
    const result = await processPendingOrderEvents();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao processar eventos de pedidos",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const user = await getUserFromRequest();

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const result = await processPendingOrderEvents();

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao processar eventos de pedidos",
      },
      { status: 500 }
    );
  }
}
