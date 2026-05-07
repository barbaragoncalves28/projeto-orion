import { getDashboardData } from "@/modules/dashboard/dashboard.service";

export async function GET() {
  try {
    const data = await getDashboardData();
    return Response.json(data);
  } catch (err: any) {
    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}