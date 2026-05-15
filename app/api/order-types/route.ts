import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(`
      SELECT id, name
      FROM order_types
      ORDER BY name
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Erro ao buscar tipos de pedido" },
      { status: 500 }
    );
  }
}