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

    const reports = await prisma.report.findMany({
      where: { labId: session.user.labId },
      include: {
        patient: true,
        bill: true,
        results: {
          include: {
            test: {
              include: {
                parent: true,
              }
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reports);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { patientId, testIds, discount, paymentStatus } = body;

    if (!patientId || !testIds || testIds.length === 0) {
      return NextResponse.json({ error: "Please select at least one clinical test." }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();

    // 1. Fetch selected tests to compute total billing
    const tests = await prisma.test.findMany({
      where: {
        id: { in: testIds },
        labId: session.user.labId,
      },
      include: {
        subTests: {
          include: {
            subTests: true
          }
        }
      }
    });

    // To calculate total, we need to gather all unique parents that these tests belong to,
    // or the tests themselves if they have no parent.
    const parentIds = new Set<string>();
    tests.forEach(t => {
      if (t.parentId) parentIds.add(t.parentId);
      else parentIds.add(t.id);
    });

    const parentTests = await prisma.test.findMany({
      where: {
        id: { in: Array.from(parentIds) },
        labId: session.user.labId,
      }
    });

    const testTotal = parentTests.reduce((sum, t) => sum + t.price, 0);
    const finalDiscount = parseFloat(discount || 0);
    const finalTotal = Math.max(0, testTotal - finalDiscount);

    // 2. Perform database transaction to guarantee integrity across Bill, Report, and ReportTests
    const bookingResult = await prisma.$transaction(async (tx) => {
      // A. Generate sequential custom ID for Bill
      const billCount = await tx.bill.count({
        where: {
          labId: session.user.labId,
          customId: { startsWith: `BILL-${currentYear}-` },
        },
      });
      const billSequence = String(billCount + 1).padStart(4, "0");
      const billCustomId = `BILL-${currentYear}-${billSequence}`;

      // Create Bill
      const bill = await tx.bill.create({
        data: {
          customId: billCustomId,
          labId: session.user.labId,
          patientId,
          total: finalTotal,
          discount: finalDiscount,
          status: paymentStatus || "UNPAID",
        },
      });

      // B. Generate sequential custom ID for Report
      const reportCount = await tx.report.count({
        where: {
          labId: session.user.labId,
          customId: { startsWith: `REP-${currentYear}-` },
        },
      });
      const reportSequence = String(reportCount + 1).padStart(4, "0");
      const reportCustomId = `REP-${currentYear}-${reportSequence}`;

      // Create Report
      const report = await tx.report.create({
        data: {
          customId: reportCustomId,
          labId: session.user.labId,
          billId: bill.id,
          patientId,
          status: "PENDING",
        },
      });

      // C. Create blank result records for selected tests
      // If a test has subtests, we add the subtests to the report, not the parent test itself.
      const reportTestsData: any[] = [];
      
      for (const t of tests) {
        if (t.subTests && t.subTests.length > 0) {
          for (const param of t.subTests) {
            if (param.fieldType === "Multiple Field" && param.subTests && param.subTests.length > 0) {
              for (const subParam of param.subTests) {
                if (!reportTestsData.find(rt => rt.testId === subParam.id)) {
                  reportTestsData.push({
                    reportId: report.id,
                    testId: subParam.id,
                    resultValue: null,
                    isAbnormal: false,
                  });
                }
              }
            } else {
              // Single field parameter
              if (!reportTestsData.find(rt => rt.testId === param.id)) {
                reportTestsData.push({
                  reportId: report.id,
                  testId: param.id,
                  resultValue: param.fieldType === "Custom Editor" ? param.interpretation : null,
                  isAbnormal: false,
                });
              }
            }
          }
        } else {
          // No parameters inside main test, just add the test itself
          if (!reportTestsData.find(rt => rt.testId === t.id)) {
            reportTestsData.push({
              reportId: report.id,
              testId: t.id,
              resultValue: t.fieldType === "Custom Editor" ? t.interpretation : null,
              isAbnormal: false,
            });
          }
        }
      }

      await tx.reportTest.createMany({
        data: reportTestsData,
      });

      return { bill, report };
    });

    return NextResponse.json(bookingResult);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
