import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || "booking@insighttoaction.co.nz";
const CONSULTANT_EMAIL = process.env.CONSULTANT_EMAIL || "";
const CONSULTANT_NAME = "Insight to Action";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-NZ", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Pacific/Auckland",
    timeZoneName: "short",
  }).format(date);
}

interface BookingEmailParams {
  bookerName: string;
  bookerEmail: string;
  meetingTypeName: string;
  startTime: Date;
  endTime: Date;
  notes?: string | null;
  cancellationKey: string;
  teamsLink?: string | null;
}

export async function sendBookingConfirmation(params: BookingEmailParams) {
  const manageUrl = `${BASE_URL}/manage/${params.cancellationKey}`;
  const dateStr = formatDateTime(params.startTime);
  const endStr = new Intl.DateTimeFormat("en-NZ", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Pacific/Auckland",
  }).format(params.endTime);

  // Email to the booker
  await resend.emails.send({
    from: `${CONSULTANT_NAME} <${FROM_EMAIL}>`,
    to: params.bookerEmail,
    subject: `Booking Confirmed: ${params.meetingTypeName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Booking Confirmed</h2>
        <p>Hi ${params.bookerName},</p>
        <p>Your <strong>${params.meetingTypeName}</strong> has been confirmed.</p>
        <div style="background: #f0f4ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>When:</strong> ${dateStr} – ${endStr}</p>
          ${params.teamsLink ? `<p style="margin: 4px 0;"><strong>Join meeting:</strong> <a href="${params.teamsLink}" style="color: #2563eb;">Microsoft Teams Link</a></p>` : ""}
          ${params.notes ? `<p style="margin: 4px 0;"><strong>Notes:</strong> ${params.notes}</p>` : ""}
        </div>
        <p>A calendar invitation has been sent to your email.</p>
        <p style="margin-top: 24px;">
          <a href="${manageUrl}" style="color: #2563eb;">Reschedule or cancel this booking</a>
        </p>
        <hr style="margin-top: 32px; border: none; border-top: 1px solid #e5e7eb;" />
        <p style="color: #6b7280; font-size: 14px;">${CONSULTANT_NAME}</p>
      </div>
    `,
  });

  // Email to the consultant
  if (CONSULTANT_EMAIL) {
    await resend.emails.send({
      from: `Booking System <${FROM_EMAIL}>`,
      to: CONSULTANT_EMAIL,
      subject: `New Booking: ${params.meetingTypeName} with ${params.bookerName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Booking</h2>
          <div style="background: #f0f4ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Type:</strong> ${params.meetingTypeName}</p>
            <p style="margin: 4px 0;"><strong>When:</strong> ${dateStr} – ${endStr}</p>
            <p style="margin: 4px 0;"><strong>Client:</strong> ${params.bookerName} (${params.bookerEmail})</p>
            ${params.notes ? `<p style="margin: 4px 0;"><strong>Notes:</strong> ${params.notes}</p>` : ""}
          </div>
        </div>
      `,
    });
  }
}

export async function sendCancellationNotification(params: {
  bookerName: string;
  bookerEmail: string;
  meetingTypeName: string;
  startTime: Date;
}) {
  const dateStr = formatDateTime(params.startTime);

  await resend.emails.send({
    from: `${CONSULTANT_NAME} <${FROM_EMAIL}>`,
    to: params.bookerEmail,
    subject: `Booking Cancelled: ${params.meetingTypeName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Booking Cancelled</h2>
        <p>Hi ${params.bookerName},</p>
        <p>Your <strong>${params.meetingTypeName}</strong> on ${dateStr} has been cancelled.</p>
        <p>If you'd like to rebook, please visit <a href="${BASE_URL}" style="color: #2563eb;">${BASE_URL}</a>.</p>
        <hr style="margin-top: 32px; border: none; border-top: 1px solid #e5e7eb;" />
        <p style="color: #6b7280; font-size: 14px;">${CONSULTANT_NAME}</p>
      </div>
    `,
  });

  if (CONSULTANT_EMAIL) {
    await resend.emails.send({
      from: `Booking System <${FROM_EMAIL}>`,
      to: CONSULTANT_EMAIL,
      subject: `Booking Cancelled: ${params.meetingTypeName} with ${params.bookerName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Booking Cancelled</h2>
          <p><strong>${params.bookerName}</strong> (${params.bookerEmail}) cancelled their <strong>${params.meetingTypeName}</strong> on ${dateStr}.</p>
        </div>
      `,
    });
  }
}
