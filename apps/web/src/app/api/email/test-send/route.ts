import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.SMTP_API_KEY);

export async function GET() {
  try {
    // Test 1: Send to delivered@resend.dev (should succeed)
    await resend.emails.send({
      from: "no-reply@rathburn.app",
      to: ["delivered@resend.dev"],
      subject: "Test Email 1 - Delivery Test",
      html: "<p>This email should be delivered successfully.</p>",
    });

    // Test 2: Send to bounced@resend.dev (should fail)
    await resend.emails.send({
      from: "no-reply@rathburn.app",
      to: ["bounced@resend.dev"],
      subject: "Test Email 2 - Bounce Test",
      html: "<p>This email should bounce.</p>",
    });

    // Test 3: Send to your personal email
    await resend.emails.send({
      from: "no-reply@rathburn.app",
      to: ["conrad.thom14@gmail.com"],
      subject: "Test Email 3 - Personal Test",
      html: `
        <h1>Hello from Rathburn App!</h1>
        <p>This is a test email to verify our Resend setup is working.</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Test emails sent",
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
