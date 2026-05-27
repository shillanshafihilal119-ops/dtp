import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const request = await req.json();

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Missing Resend API key" },
        { status: 500 }
      );
    }

    const adminEmail =
      process.env.ADMIN_NOTIFICATION_EMAIL || "shillanshafihilal119@gmail.com";

    const subject = `New Paper Request: ${request.request_id}`;

    const html = `
      <div style="font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; padding: 24px;">
        <div style="max-width: 640px; margin: 0 auto; border: 1px solid rgba(234,179,8,0.35); border-radius: 16px; padding: 24px; background: #111111;">
          <p style="color: #eab308; font-weight: 700; margin: 0 0 10px;">Vintage DTP</p>
          <h1 style="margin: 0 0 18px; color: #ffffff;">New Paper Request Submitted</h1>

          <p style="margin: 0 0 18px; color: #d4d4d8;">
            A new teacher has submitted a paper request.
          </p>

          <table style="width: 100%; border-collapse: collapse; color: #ffffff;">
            <tr><td style="padding: 8px 0; color: #a1a1aa;">Request ID</td><td style="padding: 8px 0; font-weight: 700;">${request.request_id}</td></tr>
            <tr><td style="padding: 8px 0; color: #a1a1aa;">Teacher</td><td style="padding: 8px 0;">${request.teacher_name}</td></tr>
            <tr><td style="padding: 8px 0; color: #a1a1aa;">Phone</td><td style="padding: 8px 0;">${request.phone}</td></tr>
            <tr><td style="padding: 8px 0; color: #a1a1aa;">School</td><td style="padding: 8px 0;">${request.school}</td></tr>
            <tr><td style="padding: 8px 0; color: #a1a1aa;">Class</td><td style="padding: 8px 0;">${request.class}</td></tr>
            <tr><td style="padding: 8px 0; color: #a1a1aa;">Subject</td><td style="padding: 8px 0;">${request.subject}</td></tr>
            <tr><td style="padding: 8px 0; color: #a1a1aa;">Medium</td><td style="padding: 8px 0;">${request.medium}</td></tr>
          </table>

          <div style="margin-top: 24px;">
            <a href="https://dtp-gules.vercel.app/admin" style="display: inline-block; background: #eab308; color: #000000; padding: 12px 18px; border-radius: 8px; font-weight: 700; text-decoration: none;">
              Open Admin Dashboard
            </a>
          </div>
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Vintage DTP <onboarding@resend.dev>",
        to: adminEmail,
        subject,
        html,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.log(result);

      return NextResponse.json(
        { success: false, error: "Email notification failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { success: false, error: "Notification failed" },
      { status: 500 }
    );
  }
}