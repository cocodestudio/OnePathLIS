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
    const { name, category, interpretation, fieldType, type, price, unit, genderRefType, refRangeMin, refRangeMax, refRangeMinMale, refRangeMaxMale, refRangeMinFemale, refRangeMaxFemale, subTests, valueType, customOptions } = body;

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
          fieldType: fieldType !== undefined ? fieldType : test.fieldType,
          type: type !== undefined ? type : test.type,
          interpretation: interpretation !== undefined ? interpretation : test.interpretation,
          price: price !== undefined ? parseFloat(price) : test.price,
          unit: unit !== undefined ? unit : test.unit,
          genderRefType: genderRefType !== undefined ? genderRefType : test.genderRefType,
          refRangeMin: refRangeMin !== undefined && refRangeMin !== "" ? parseFloat(refRangeMin) : test.refRangeMin,
          refRangeMax: refRangeMax !== undefined && refRangeMax !== "" ? parseFloat(refRangeMax) : test.refRangeMax,
          refRangeMinMale: refRangeMinMale !== undefined && refRangeMinMale !== "" ? parseFloat(refRangeMinMale) : test.refRangeMinMale,
          refRangeMaxMale: refRangeMaxMale !== undefined && refRangeMaxMale !== "" ? parseFloat(refRangeMaxMale) : test.refRangeMaxMale,
          refRangeMinFemale: refRangeMinFemale !== undefined && refRangeMinFemale !== "" ? parseFloat(refRangeMinFemale) : test.refRangeMinFemale,
          refRangeMaxFemale: refRangeMaxFemale !== undefined && refRangeMaxFemale !== "" ? parseFloat(refRangeMaxFemale) : test.refRangeMaxFemale,
          valueType: valueType !== undefined ? valueType : test.valueType,
          customOptions: customOptions !== undefined ? (customOptions ? JSON.stringify(customOptions) : null) : test.customOptions,
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
            fieldType: sub.fieldType || "Single Field",
            interpretation: sub.interpretation || null,
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
            valueType: sub.valueType || "Numeric",
            customOptions: sub.customOptions ? JSON.stringify(sub.customOptions) : null,
          };

          if (sub.id) {
            await tx.test.update({
              where: { id: sub.id },
              data: subData
            });

            if (sub.subTests && Array.isArray(sub.subTests)) {
              const incomingSubIds = sub.subTests.map((s: any) => s.id).filter(Boolean);
              await tx.test.deleteMany({
                where: { parentId: sub.id, id: { notIn: incomingSubIds } }
              });

              for (const subsub of sub.subTests) {
                const subsubData = {
                  name: subsub.name,
                  category: category !== undefined ? category : test.category,
                  type: type !== undefined ? type : test.type,
                  price: 0,
                  unit: subsub.unit,
                  genderRefType: subsub.genderRefType || "BOTH",
                  refRangeMin: subsub.refRangeMin ? parseFloat(subsub.refRangeMin) : null,
                  refRangeMax: subsub.refRangeMax ? parseFloat(subsub.refRangeMax) : null,
                  refRangeMinMale: subsub.refRangeMinMale !== undefined && subsub.refRangeMinMale !== "" ? parseFloat(subsub.refRangeMinMale) : null,
                  refRangeMaxMale: subsub.refRangeMaxMale !== undefined && subsub.refRangeMaxMale !== "" ? parseFloat(subsub.refRangeMaxMale) : null,
                  refRangeMinFemale: subsub.refRangeMinFemale !== undefined && subsub.refRangeMinFemale !== "" ? parseFloat(subsub.refRangeMinFemale) : null,
                  refRangeMaxFemale: subsub.refRangeMaxFemale !== undefined && subsub.refRangeMaxFemale !== "" ? parseFloat(subsub.refRangeMaxFemale) : null,
                  valueType: subsub.valueType || "Numeric",
                  customOptions: subsub.customOptions ? JSON.stringify(subsub.customOptions) : null,
                };
                
                if (subsub.id) {
                  await tx.test.update({ where: { id: subsub.id }, data: subsubData });
                } else {
                  await tx.test.create({
                    data: {
                      id: `${params.id}-${sub.name}-${subsub.name}-${Date.now()}`.replace(/\s+/g, "_"),
                      labId: session.user.labId,
                      parentId: sub.id,
                      ...subsubData
                    }
                  });
                }
              }
            } else {
              await tx.test.deleteMany({ where: { parentId: sub.id } });
            }
          } else {
            const createdSub = await tx.test.create({
              data: {
                id: `${params.id}-${sub.name}-${Date.now()}`.replace(/\s+/g, "_"),
                labId: session.user.labId,
                parentId: params.id,
                ...subData
              }
            });

            if (sub.subTests && Array.isArray(sub.subTests) && sub.subTests.length > 0) {
              await tx.test.createMany({
                data: sub.subTests.map((subsub: any, idx: number) => ({
                  id: `${params.id}-${sub.name}-${subsub.name}-${Date.now()}-${idx}`.replace(/\s+/g, "_"),
                  labId: session.user.labId,
                  parentId: createdSub.id,
                  name: subsub.name,
                  category: category !== undefined ? category : test.category,
                  type: type !== undefined ? type : test.type,
                  price: 0,
                  unit: subsub.unit,
                  genderRefType: subsub.genderRefType || "BOTH",
                  refRangeMin: subsub.refRangeMin ? parseFloat(subsub.refRangeMin) : null,
                  refRangeMax: subsub.refRangeMax ? parseFloat(subsub.refRangeMax) : null,
                  refRangeMinMale: subsub.refRangeMinMale !== undefined && subsub.refRangeMinMale !== "" ? parseFloat(subsub.refRangeMinMale) : null,
                  refRangeMaxMale: subsub.refRangeMaxMale !== undefined && subsub.refRangeMaxMale !== "" ? parseFloat(subsub.refRangeMaxMale) : null,
                  refRangeMinFemale: subsub.refRangeMinFemale !== undefined && subsub.refRangeMinFemale !== "" ? parseFloat(subsub.refRangeMinFemale) : null,
                  refRangeMaxFemale: subsub.refRangeMaxFemale !== undefined && subsub.refRangeMaxFemale !== "" ? parseFloat(subsub.refRangeMaxFemale) : null,
                  valueType: subsub.valueType || "Numeric",
                  customOptions: subsub.customOptions ? JSON.stringify(subsub.customOptions) : null,
                }))
              });
            }
          }
        }
      }

      return tx.test.findUnique({
        where: { id: params.id },
        include: { subTests: { include: { subTests: true } } }
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
