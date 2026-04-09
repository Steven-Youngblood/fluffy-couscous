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

  const result = await client.api("/me/calendar/getSchedule").post({
    schedules: ["me"],
    startTime: { dateTime: startDate, timeZone: timezone },
    endTime: { dateTime: endDate, timeZone: timezone },
    availabilityViewInterval: 15,
  });

  const schedule = result.value?.[0];
  if (!schedule?.scheduleItems) return [];

  return schedule.scheduleItems.map(
    (item: { start: { dateTime: string }; end: { dateTime: string }; status: string }) => ({
      start: item.start.dateTime,
      end: item.end.dateTime,
      status: item.status,
    })
  );
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
