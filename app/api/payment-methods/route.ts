import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(`
      SELECT id, name
      FROM payment_methods
      ORDER BY name
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Erro ao buscar formas de pagamento" },
      { status: 500 }
    );
  }
}