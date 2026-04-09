import { Client } from "@microsoft/microsoft-graph-client";
import { getAccessToken } from "./tokens";

function getGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => done(null, accessToken),
  });
}

export interface FreeBusyBlock {
  start: string;
  end: string;
  status: string;
}

export async function getFreeBusy(
  startDate: string,
  endDate: string,
  timezone: string
): Promise<FreeBusyBlock[]> {
  const accessToken = await getAccessToken();
  const client = getGraphClient(accessToken);

  // Use calendarView to get all events in the time range
  const result = await client
    .api("/me/calendarView")
    .query({
      startDateTime: `${startDate}`,
      endDateTime: `${endDate}`,
      $select: "start,end,showAs",
      $top: 50,
    })
    .header("Prefer", `outlook.timezone="${timezone}"`)
    .get();

  if (!result?.value) return [];

  return result.value
    .filter((event: { showAs: string }) =>
      // Include busy, tentative, and out-of-office events
      event.showAs !== "free"
    )
    .map((event: { start: { dateTime: string }; end: { dateTime: string }; showAs: string }) => ({
      start: event.start.dateTime,
      end: event.end.dateTime,
      status: event.showAs,
    }));
}

export interface CreateEventParams {
  subject: string;
  startDateTime: string;
  endDateTime: string;
  timezone: string;
  attendeeEmail: string;
  attendeeName: string;
  body?: string;
}

export async function createCalendarEvent(
  params: CreateEventParams
): Promise<string> {
  const accessToken = await getAccessToken();
  const client = getGraphClient(accessToken);

  const event = await client.api("/me/events").post({
    subject: params.subject,
    start: {
      dateTime: params.startDateTime,
      timeZone: params.timezone,
    },
    end: {
      dateTime: params.endDateTime,
      timeZone: params.timezone,
    },
    attendees: [
      {
        emailAddress: {
          address: params.attendeeEmail,
          name: params.attendeeName,
        },
        type: "required",
      },
    ],
    body: params.body
      ? { contentType: "HTML", content: params.body }
      : undefined,
    isOnlineMeeting: true,
  });

  return event.id;
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const accessToken = await getAccessToken();
  const client = getGraphClient(accessToken);
  await client.api(`/me/events/${eventId}`).delete();
}
