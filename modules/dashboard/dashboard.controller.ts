import { NextResponse } from "next/server";
import { getDashboardData } from "./dashboard.service";

export async function getDashboardController() {
  const data = await getDashboardData();
  return NextResponse.json(data);
}