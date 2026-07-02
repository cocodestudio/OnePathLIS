import { NextResponse } from "next/server";
import { fetchFromLaravel } from "@/lib/api-client";

export async function GET() {
  try {
    const data = await fetchFromLaravel('/lab');
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const data = await fetchFromLaravel('/lab', {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
