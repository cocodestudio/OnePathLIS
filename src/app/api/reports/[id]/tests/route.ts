import { NextResponse } from "next/server";
import { fetchFromLaravel } from "@/lib/api-client";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const data = await fetchFromLaravel(`/reports/${params.id}/tests`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(request.url);
    const mainTestId = url.searchParams.get('mainTestId');
    const data = await fetchFromLaravel(`/reports/${params.id}/tests`, {
      method: 'DELETE',
      body: JSON.stringify({ mainTestId })
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
