import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lab = await prisma.lab.findUnique({
      where: { id: session.user.labId },
      select: {
        printBgImage: true,
        printHeaderHeight: true,
        printFooterHeight: true,
        printMarginLeft: true,
        printMarginRight: true,
      }
    });

    if (!lab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    return NextResponse.json(lab);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bgImage, headerHeight, footerHeight, marginLeft, marginRight } = body;

    const updatedLab = await prisma.lab.update({
      where: { id: session.user.labId },
      data: {
        printBgImage: bgImage,
        printHeaderHeight: headerHeight,
        printFooterHeight: footerHeight,
        printMarginLeft: marginLeft,
        printMarginRight: marginRight,
      },
    });

    return NextResponse.json(updatedLab);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
