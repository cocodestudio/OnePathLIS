import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Add a test to a report
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { testId } = await request.json();
    if (!testId) {
      return NextResponse.json({ error: "Test ID is required." }, { status: 400 });
    }

    const report = await prisma.report.findFirst({
      where: { id: params.id, labId: session.user.labId },
      include: { results: true },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const test = await prisma.test.findFirst({
      where: { id: testId, labId: session.user.labId },
      include: {
        subTests: {
          include: {
            subTests: true
          }
        }
      }
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found." }, { status: 404 });
    }

    // Extract all leaf parameters to add
    const reportTestsData: any[] = [];
    if (test.subTests && test.subTests.length > 0) {
      for (const param of test.subTests) {
        if (param.fieldType === "Multiple Field" && param.subTests && param.subTests.length > 0) {
          for (const subParam of param.subTests) {
            reportTestsData.push({
              reportId: report.id,
              testId: subParam.id,
              resultValue: null,
              isAbnormal: false,
            });
          }
        } else {
          reportTestsData.push({
            reportId: report.id,
            testId: param.id,
            resultValue: param.fieldType === "Custom Editor" ? param.interpretation : null,
            isAbnormal: false,
          });
        }
      }
    } else {
      reportTestsData.push({
        reportId: report.id,
        testId: test.id,
        resultValue: test.fieldType === "Custom Editor" ? test.interpretation : null,
        isAbnormal: false,
      });
    }

    // Ensure they aren't already in the report
    const existingTestIds = report.results.map((r: any) => r.testId);
    const toAdd = reportTestsData.filter(rt => !existingTestIds.includes(rt.testId));

    if (toAdd.length === 0) {
      return NextResponse.json({ error: "Test or its parameters already exist in this report." }, { status: 400 });
    }

    await prisma.reportTest.createMany({
      data: toAdd
    });

    // Update bill total
    if (report.billId) {
      const bill = await prisma.bill.findFirst({ where: { id: report.billId } });
      if (bill) {
        const newTotal = bill.total + test.price;
        const balance = newTotal - bill.paidAmount;
        let newStatus = "UNPAID";
        if (balance <= 0) {
          newStatus = "PAID";
        } else if (bill.paidAmount > 0) {
          newStatus = "PARTIAL";
        }

        await prisma.bill.update({
          where: { id: report.billId },
          data: {
            total: newTotal,
            status: newStatus
          }
        });
      }
    }

    return NextResponse.json({ success: true, addedCount: toAdd.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Remove a test result from a report
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mainTestId = searchParams.get("mainTestId");

    if (!mainTestId) {
      return NextResponse.json({ error: "mainTestId is required." }, { status: 400 });
    }

    const report = await prisma.report.findFirst({
      where: { id: params.id, labId: session.user.labId },
      include: { results: { include: { test: { include: { parent: { include: { parent: true } } } } } } },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    // Find all results belonging to this mainTestId
    const resultIdsToDelete = report.results.filter((r: any) => {
      const mt = r.test.parent?.parent ? r.test.parent.parent : (r.test.parent ? r.test.parent : r.test);
      return mt.id === mainTestId;
    }).map((r: any) => r.id);

    if (resultIdsToDelete.length === 0) {
      return NextResponse.json({ error: "No tests found to remove." }, { status: 404 });
    }

    await prisma.reportTest.deleteMany({
      where: { id: { in: resultIdsToDelete } }
    });

    // Subtract from bill total
    const test = await prisma.test.findFirst({
      where: { id: mainTestId }
    });

    if (report.billId && test) {
      const bill = await prisma.bill.findFirst({ where: { id: report.billId } });
      if (bill) {
        const newTotal = Math.max(0, bill.total - test.price);
        const balance = newTotal - bill.paidAmount;
        let newStatus = "UNPAID";
        if (balance <= 0) {
          newStatus = "PAID";
        } else if (bill.paidAmount > 0) {
          newStatus = "PARTIAL";
        }

        await prisma.bill.update({
          where: { id: report.billId },
          data: {
            total: newTotal,
            status: newStatus
          }
        });
      }
    }

    return NextResponse.json({ success: true, deletedCount: resultIdsToDelete.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
