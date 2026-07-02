import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/lis";

export async function fetchFromLaravel(endpoint: string, options: RequestInit = {}) {
  const session = await getServerSession(authOptions);
  
  if (!session || !(session.user as any).accessToken) {
    throw new Error("Unauthorized");
  }

  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Bearer ${(session.user as any).accessToken}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle empty responses
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || data.error || "API request failed");
  }

  return data;
}
