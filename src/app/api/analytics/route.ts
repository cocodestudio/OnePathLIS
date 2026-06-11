import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const labId = session.user.labId;

    // Time boundaries for Today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Fetch statistics for Today
    const totalPatientsToday = await prisma.patient.count({
      where: {
        labId,
        createdAt: { gte: startOfToday, lte: endOfToday },
      },
    });

    const totalReportsToday = await prisma.report.count({
      where: {
        labId,
        createdAt: { gte: startOfToday, lte: endOfToday },
      },
    });

    const pendingReportsToday = await prisma.report.count({
      where: {
        labId,
        status: "PENDING",
        createdAt: { gte: startOfToday, lte: endOfToday },
      },
    });

    const revenueTodayAgg = await prisma.bill.aggregate({
      where: {
        labId,
        createdAt: { gte: startOfToday, lte: endOfToday },
      },
      _sum: {
        total: true,
      },
    });
    const revenueToday = revenueTodayAgg._sum.total || 0;

    // 2. Fetch past 7 days history for trend charts
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      
      const start = new Date(targetDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(targetDate);
      end.setHours(23, 59, 59, 999);

      const dayReportsCount = await prisma.report.count({
        where: {
          labId,
          createdAt: { gte: start, lte: end },
        },
      });

      const dayRevenueAgg = await prisma.bill.aggregate({
        where: {
          labId,
          createdAt: { gte: start, lte: end },
        },
        _sum: {
          total: true,
        },
      });
      const dayRevenue = dayRevenueAgg._sum.total || 0;

      chartData.push({
        date: targetDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
        reports: dayReportsCount,
        revenue: dayRevenue,
      });
    }

    // 3. Fetch category breakdown (CBC vs LFT vs KFT vs Thyroid)
    const reportTests = await prisma.reportTest.findMany({
      where: {
        report: {
          labId,
        },
      },
      include: {
        test: true,
      },
    });

    const categoryCounts: Record<string, number> = {};
    reportTests.forEach((rt) => {
      const cat = rt.test.category;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const categoryData = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      value: count,
    }));

    return NextResponse.json({
      stats: {
        patientsToday: totalPatientsToday,
        totalReports: totalReportsToday,
        pendingReports: pendingReportsToday,
        revenue: revenueToday,
      },
      chartData,
      categoryData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
