import { API_BASE_URL } from "../config/IP";

export interface TestData {
  user: string;
  message: string;
}

export async function pingBackend(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE_URL}/tester/ping`);
  if (!res.ok) {
    throw new Error("Ping failed");
  }
  return res.json();
}

export async function sendTestData(
  data: TestData
): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE_URL}/tester`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("POST failed");
  }

  return res.json();
}
