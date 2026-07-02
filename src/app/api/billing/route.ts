import { NextResponse } from "next/server";
import { fetchFromLaravel } from "@/lib/api-client";

export async function GET() {
  try {
    const data = await fetchFromLaravel('/bills');
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
