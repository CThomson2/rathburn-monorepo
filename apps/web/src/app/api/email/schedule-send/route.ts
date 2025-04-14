import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.SMTP_API_KEY);

export async function POST(request: Request) {
  try {
    const { scheduledTime, recipient } = await request.json();

    // Use the standard send options and handle scheduling separately if needed
    const email = await resend.emails.send({
      from: "no-reply@rathburn.app",
      to: [recipient],
      subject: "Scheduled Test Email",
      html: "<p>This is a scheduled test email.</p>",
      scheduledAt: scheduledTime, // ISO timestamp
    });

    return NextResponse.json({
      success: true,
      emailId: (email as any).data?.id, // Safely access id with type assertion
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
