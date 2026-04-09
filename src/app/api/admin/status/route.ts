import { getSession } from "@/lib/session";
import { isCalendarConnected } from "@/lib/tokens";

export async function GET() {
  const session = await getSession();

  if (!session.isAdmin) {
    return Response.json({ isAdmin: false, calendarConnected: false });
  }

  const calendarConnected = await isCalendarConnected();

  return Response.json({ isAdmin: true, calendarConnected });
}
