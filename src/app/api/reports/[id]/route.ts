import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const report = await prisma.report.findFirst({
      where: {
        id: params.id,
        labId: session.user.labId,
      },
      include: {
        patient: true,
        bill: true,
        lab: true,
        results: {
          include: {
            test: {
              include: {
                parent: {
                  include: {
                    parent: true
                  }
                }
              }
            },
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report file not found." }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
    const { results, printedInterpretations } = body;

    if (!results || !Array.isArray(results)) {
      return NextResponse.json({ error: "Results array is required." }, { status: 400 });
    }

    // Fetch report to verify owner and read reference ranges
    const report = await prisma.report.findFirst({
      where: {
        id: params.id,
        labId: session.user.labId,
      },
      include: {
        patient: true,
        results: {
          include: {
            test: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    // Process all result value updates
    await prisma.$transaction(
      results.map((resItem) => {
        const matchingResult = report.results.find((r) => r.id === resItem.id);
        
        if (!matchingResult) {
          throw new Error(`Test result field "${resItem.id}" not found in this report.`);
        }

        // Compare and mark abnormal if value is numerical and outside boundary limits
        let isAbnormal = false;
        if (resItem.resultValue && resItem.resultValue.trim() !== "") {
          const valNum = parseFloat(resItem.resultValue);
          if (!isNaN(valNum)) {
            let minRange = matchingResult.test.refRangeMin;
            let maxRange = matchingResult.test.refRangeMax;
            
            if (matchingResult.test.genderRefType === "GENDER_SPECIFIC") {
              const gender = report.patient.gender.toLowerCase();
              if (gender === "female") {
                minRange = matchingResult.test.refRangeMinFemale ?? minRange;
                maxRange = matchingResult.test.refRangeMaxFemale ?? maxRange;
              } else {
                minRange = matchingResult.test.refRangeMinMale ?? minRange;
                maxRange = matchingResult.test.refRangeMaxMale ?? maxRange;
              }
            }
            
            if (minRange !== null && maxRange !== null) {
              isAbnormal = valNum < minRange || valNum > maxRange;
            }
          }
        }

        return prisma.reportTest.update({
          where: { id: resItem.id },
          data: {
            resultValue: resItem.resultValue,
            isAbnormal,
          },
        });
      })
    );

    // Update the parent report status to COMPLETED
    const updatedReport = await prisma.report.update({
      where: { id: params.id },
      data: {
        status: "COMPLETED",
        printedInterpretations: printedInterpretations !== undefined ? JSON.stringify(printedInterpretations) : undefined,
      },
      include: {
        patient: true,
        bill: true,
        results: {
          include: {
            test: {
              include: {
                parent: {
                  include: {
                    parent: true
                  }
                }
              }
            },
          },
        },
      },
    });

    return NextResponse.json(updatedReport);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
