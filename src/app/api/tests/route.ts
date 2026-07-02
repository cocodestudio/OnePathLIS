import { NextResponse } from "next/server";
import { fetchFromLaravel } from "@/lib/api-client";

export async function GET() {
  try {
    const data = await fetchFromLaravel('/tests');
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await fetchFromLaravel('/tests', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
