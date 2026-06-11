import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { discount, status } = body;

    const bill = await prisma.bill.findFirst({
      where: {
        id: params.id,
        labId: session.user.labId,
      },
      include: {
        reports: {
          include: {
            results: {
              include: {
                test: true,
              },
            },
          },
        },
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Invoice file not found." }, { status: 404 });
    }

    // Sum base price of all tests listed under this bill's reports
    let originalTestTotal = 0;
    bill.reports.forEach((rep) => {
      rep.results.forEach((res) => {
        originalTestTotal += res.test.price;
      });
    });

    const finalDiscount = discount !== undefined ? parseFloat(discount) : bill.discount;
    const finalTotal = Math.max(0, originalTestTotal - finalDiscount);
    const finalStatus = status !== undefined ? status : bill.status;

    const updatedBill = await prisma.bill.update({
      where: { id: params.id },
      data: {
        discount: finalDiscount,
        total: finalTotal,
        status: finalStatus,
      },
    });

    return NextResponse.json(updatedBill);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
