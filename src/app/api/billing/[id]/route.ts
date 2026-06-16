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
    const { discount, status, paidAmount } = body;

    const bill = await prisma.bill.findFirst({
      where: {
        id: params.id,
        labId: session.user.labId,
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Invoice file not found." }, { status: 404 });
    }

    const finalDiscount = discount !== undefined ? parseFloat(discount) : bill.discount;
    const finalTotal = Math.max(0, bill.total + bill.discount - finalDiscount);
    const finalPaidAmount = paidAmount !== undefined ? parseFloat(paidAmount) : bill.paidAmount;

    let finalStatus = "UNPAID";
    const balance = finalTotal - finalPaidAmount;
    if (balance <= 0) {
      finalStatus = "PAID";
    } else if (finalPaidAmount > 0) {
      finalStatus = "PARTIAL";
    }

    const updatedBill = await prisma.bill.update({
      where: { id: params.id },
      data: {
        discount: finalDiscount,
        total: finalTotal,
        paidAmount: finalPaidAmount,
        status: finalStatus,
      },
    });

    return NextResponse.json(updatedBill);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
