import { NextResponse } from "next/server";
import { getDashboardData } from "@/modules/dashboard/dashboard.service";

export async function GET() {
  try {
    const data = await getDashboardData();
    return NextResponse.json(data);  
  } catch (error) {
    console.error("ERRO DASHBOARD:", error);

    return NextResponse.json(
      { error: "Erro ao carregar dashboard" },
      { status: 500 }
    );
  }
}