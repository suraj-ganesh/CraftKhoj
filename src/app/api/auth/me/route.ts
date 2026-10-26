import { requireUser, json } from "@/lib/api";

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) return response!;
  return json({
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, status: user.status },
  });
}
