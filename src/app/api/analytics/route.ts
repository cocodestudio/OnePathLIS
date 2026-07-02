import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchFromLaravel } from "@/lib/api-client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await fetchFromLaravel('/analytics');
    
    // Convert Laravel's response back to what the frontend expects
    const analyticsData = {
      patientsCount: data.totalPatients,
      reportsCount: data.totalReports,
      revenueTotal: data.totalRevenue,
      todayPatients: 0, // Laravel endpoint doesn't return this yet, but frontend expects it
      todayReports: data.todayReports,
      todayRevenue: 0, // Laravel doesn't return today's revenue explicitly
      pendingReports: data.totalReports - data.completedReports,
      completedReports: data.completedReports,
      reportsOverTime: [], // Could be added to Laravel later
      revenueOverTime: [],
      recentAbnormalTests: []
    };

    return NextResponse.json(analyticsData);
  } catch (error: any) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
