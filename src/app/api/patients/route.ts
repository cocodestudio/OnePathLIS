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

    const patients = await prisma.patient.findMany({
      where: { labId: session.user.labId },
      include: {
        bills: true,
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(patients);
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
    const { designation, name, age, gender, phone, refDoctor, address, collectedAt } = body;

    if (!name || !age || !gender || !phone) {
      return NextResponse.json({ error: "Please provide Name, Age, Gender, and Phone." }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();
    
    // Count how many patients registered this year in this lab to format sequential index
    const count = await prisma.patient.count({
      where: {
        labId: session.user.labId,
        customId: {
          startsWith: `LAB-${currentYear}-`,
        },
      },
    });

    const sequence = String(count + 1).padStart(4, "0");
    const customId = `LAB-${currentYear}-${sequence}`;

    const newPatient = await prisma.patient.create({
      data: {
        customId,
        labId: session.user.labId,
        designation: designation || "Mr.",
        name: name.trim(),
        age: parseInt(age),
        gender,
        phone: phone.trim(),
        refDoctor: refDoctor?.trim() || "Self",
        address: address?.trim() || "",
        collectedAt: collectedAt?.trim() || "Lab",
      },
    });

    return NextResponse.json(newPatient);
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
    const { id, designation, name, age, gender, phone, refDoctor, address, collectedAt } = body;

    if (!id) {
      return NextResponse.json({ error: "Patient ID is required." }, { status: 400 });
    }

    const patient = await prisma.patient.findFirst({
      where: { id, labId: session.user.labId },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        designation: designation || patient.designation,
        name: name?.trim() || patient.name,
        age: age ? parseInt(age) : patient.age,
        gender: gender || patient.gender,
        phone: phone?.trim() || patient.phone,
        refDoctor: refDoctor?.trim() || patient.refDoctor,
        address: address?.trim() ?? patient.address,
        collectedAt: collectedAt?.trim() ?? patient.collectedAt,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Patient ID is required." }, { status: 400 });
    }

    const patient = await prisma.patient.findFirst({
      where: { id, labId: session.user.labId },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }

    await prisma.patient.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
