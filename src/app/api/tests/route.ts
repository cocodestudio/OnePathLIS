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

    const tests = await prisma.test.findMany({
      where: { 
        labId: session.user.labId,
        parentId: null // Only fetch root tests by default
      },
      include: {
        subTests: true // Include subtests
      },
      orderBy: [
        { category: "asc" },
        { name: "asc" }
      ],
    });

    return NextResponse.json(tests);
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
    const { name, category, type, price, unit, genderRefType, refRangeMin, refRangeMax, refRangeMinMale, refRangeMaxMale, refRangeMinFemale, refRangeMaxFemale, subTests } = body;

    if (!name || !category) {
      return NextResponse.json({ error: "Please provide all required test parameters." }, { status: 400 });
    }

    const testId = `${session.user.labId}-${category}-${name}`.replace(/\s+/g, "_");

    // Check duplicate
    const existing = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (existing) {
      return NextResponse.json({ error: "A test with this name already exists in this category." }, { status: 400 });
    }

    const newTest = await prisma.test.create({
      data: {
        id: testId,
        labId: session.user.labId,
        name,
        category,
        type: type || "Pathology",
        price: price !== undefined ? parseFloat(price) : 0,
        unit,
        genderRefType: genderRefType || "BOTH",
        refRangeMin: refRangeMin ? parseFloat(refRangeMin) : null,
        refRangeMax: refRangeMax ? parseFloat(refRangeMax) : null,
        refRangeMinMale: refRangeMinMale !== undefined && refRangeMinMale !== "" ? parseFloat(refRangeMinMale) : null,
        refRangeMaxMale: refRangeMaxMale !== undefined && refRangeMaxMale !== "" ? parseFloat(refRangeMaxMale) : null,
        refRangeMinFemale: refRangeMinFemale !== undefined && refRangeMinFemale !== "" ? parseFloat(refRangeMinFemale) : null,
        refRangeMaxFemale: refRangeMaxFemale !== undefined && refRangeMaxFemale !== "" ? parseFloat(refRangeMaxFemale) : null,
        subTests: subTests && subTests.length > 0 ? {
          create: subTests.map((sub: any) => ({
            id: `${testId}-${sub.name}`.replace(/\s+/g, "_"),
            labId: session.user.labId,
            name: sub.name,
            category,
            type: type || "Pathology",
            price: 0,
            unit: sub.unit,
            genderRefType: sub.genderRefType || "BOTH",
            refRangeMin: sub.refRangeMin ? parseFloat(sub.refRangeMin) : null,
            refRangeMax: sub.refRangeMax ? parseFloat(sub.refRangeMax) : null,
            refRangeMinMale: sub.refRangeMinMale !== undefined && sub.refRangeMinMale !== "" ? parseFloat(sub.refRangeMinMale) : null,
            refRangeMaxMale: sub.refRangeMaxMale !== undefined && sub.refRangeMaxMale !== "" ? parseFloat(sub.refRangeMaxMale) : null,
            refRangeMinFemale: sub.refRangeMinFemale !== undefined && sub.refRangeMinFemale !== "" ? parseFloat(sub.refRangeMinFemale) : null,
            refRangeMaxFemale: sub.refRangeMaxFemale !== undefined && sub.refRangeMaxFemale !== "" ? parseFloat(sub.refRangeMaxFemale) : null,
          }))
        } : undefined
      },
      include: {
        subTests: true
      }
    });

    return NextResponse.json(newTest);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
