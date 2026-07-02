import { NextResponse } from "next/server";
import { fetchFromLaravel } from "@/lib/api-client";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await fetchFromLaravel(`/bills/${params.id}`);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const data = await fetchFromLaravel(`/bills/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
