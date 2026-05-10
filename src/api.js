export async function fetchDashboard() {
  const response = await fetch("/api/dashboard");

  if (!response.ok) {
    throw new Error(`Dashboard API returned ${response.status}`);
  }

  return response.json();
}
