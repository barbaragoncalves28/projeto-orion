import { NextResponse } from "next/server";
import { getDashboardService } from "./dashboard.service";

export async function getDashboardController() {
  const data = await getDashboardService();
  return NextResponse.json(data);
}