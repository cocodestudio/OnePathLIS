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
    const { name, category, type, price, unit, genderRefType, refRangeMin, refRangeMax, refRangeMinMale, refRangeMaxMale, refRangeMinFemale, refRangeMaxFemale, subTests } = body;

    const test = await prisma.test.findUnique({
      where: { id: params.id },
    });

    if (!test || test.labId !== session.user.labId) {
      return NextResponse.json({ error: "Test profile not found." }, { status: 404 });
    }

    const updatedTest = await prisma.$transaction(async (tx) => {
      // 1. Update parent test
      const parent = await tx.test.update({
        where: { id: params.id },
        data: {
          name: name !== undefined ? name : test.name,
          category: category !== undefined ? category : test.category,
          type: type !== undefined ? type : test.type,
          price: price !== undefined ? parseFloat(price) : test.price,
          unit: unit !== undefined ? unit : test.unit,
          genderRefType: genderRefType !== undefined ? genderRefType : test.genderRefType,
          refRangeMin: refRangeMin !== undefined && refRangeMin !== "" ? parseFloat(refRangeMin) : test.refRangeMin,
          refRangeMax: refRangeMax !== undefined && refRangeMax !== "" ? parseFloat(refRangeMax) : test.refRangeMax,
          refRangeMinMale: refRangeMinMale !== undefined && refRangeMinMale !== "" ? parseFloat(refRangeMinMale) : test.refRangeMinMale,
          refRangeMaxMale: refRangeMaxMale !== undefined && refRangeMaxMale !== "" ? parseFloat(refRangeMaxMale) : test.refRangeMaxMale,
          refRangeMinFemale: refRangeMinFemale !== undefined && refRangeMinFemale !== "" ? parseFloat(refRangeMinFemale) : test.refRangeMinFemale,
          refRangeMaxFemale: refRangeMaxFemale !== undefined && refRangeMaxFemale !== "" ? parseFloat(refRangeMaxFemale) : test.refRangeMaxFemale,
        },
      });

      // 2. Handle subtests if provided
      if (subTests && Array.isArray(subTests)) {
        const incomingIds = subTests.map((s: any) => s.id).filter(Boolean);
        
        // Delete subtests that are no longer in the list
        await tx.test.deleteMany({
          where: {
            parentId: params.id,
            id: { notIn: incomingIds }
          }
        });

        // Update or create subtests
        for (const sub of subTests) {
          const subData = {
            name: sub.name,
            category: category !== undefined ? category : test.category,
            type: type !== undefined ? type : test.type,
            price: 0,
            unit: sub.unit,
            genderRefType: sub.genderRefType || "BOTH",
            refRangeMin: sub.refRangeMin ? parseFloat(sub.refRangeMin) : null,
            refRangeMax: sub.refRangeMax ? parseFloat(sub.refRangeMax) : null,
            refRangeMinMale: sub.refRangeMinMale !== undefined && sub.refRangeMinMale !== "" ? parseFloat(sub.refRangeMinMale) : null,
            refRangeMaxMale: sub.refRangeMaxMale !== undefined && sub.refRangeMaxMale !== "" ? parseFloat(sub.refRangeMaxMale) : null,
            refRangeMinFemale: sub.refRangeMinFemale !== undefined && sub.refRangeMinFemale !== "" ? parseFloat(sub.refRangeMinFemale) : null,
            refRangeMaxFemale: sub.refRangeMaxFemale !== undefined && sub.refRangeMaxFemale !== "" ? parseFloat(sub.refRangeMaxFemale) : null,
          };

          if (sub.id) {
            await tx.test.update({
              where: { id: sub.id },
              data: subData
            });
          } else {
            await tx.test.create({
              data: {
                id: `${params.id}-${sub.name}-${Date.now()}`.replace(/\s+/g, "_"),
                labId: session.user.labId,
                parentId: params.id,
                ...subData
              }
            });
          }
        }
      }

      return tx.test.findUnique({
        where: { id: params.id },
        include: { subTests: true }
      });
    });

    return NextResponse.json(updatedTest);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const test = await prisma.test.findUnique({
      where: { id: params.id },
    });

    if (!test || test.labId !== session.user.labId) {
      return NextResponse.json({ error: "Test profile not found." }, { status: 404 });
    }

    // This will cascade delete any reportTests referencing this test
    await prisma.test.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Test deleted successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
