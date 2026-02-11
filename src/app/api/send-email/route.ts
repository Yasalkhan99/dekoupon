import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const getTransporter = () => {
  const host = process.env.SMTP_HOST?.trim();
  const port = parseInt(process.env.SMTP_PORT?.trim() ?? "587", 10);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) {
    return null;
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

/** Recipient for contact/newsletter/coupon emails. Defaults to SMTP_USER if not set. */
const getToEmail = () =>
  process.env.SMTP_RECIPIENT?.trim() || process.env.SMTP_USER?.trim() || "";

export async function POST(request: NextRequest) {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      return NextResponse.json(
        { error: "SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env" },
        { status: 503 }
      );
    }

    const toEmail = getToEmail();
    if (!toEmail) {
      return NextResponse.json(
        { error: "No recipient. Set SMTP_RECIPIENT or SMTP_USER." },
        { status: 503 }
      );
    }

    let body: Record<string, string>;
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = (await request.json()) as Record<string, string>;
    } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      body = Object.fromEntries(
        Array.from(formData.entries()).map(([k, v]) => [k, String(v)])
      ) as Record<string, string>;
    } else {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    }

    const type = (body.type || body.formType || "").toLowerCase();

    if (type === "contact") {
      const { name, email, subject, message } = body;
      if (!email || !message) {
        return NextResponse.json(
          { error: "Missing email or message" },
          { status: 400 }
        );
      }
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: toEmail,
        replyTo: email,
        subject: `[Contact] ${subject || "No subject"} – ${name || "Unknown"}`,
        text: `Name: ${name || "—"}\nEmail: ${email}\nSubject: ${subject || "—"}\n\nMessage:\n${message}`,
        html: `<p><strong>Name:</strong> ${escapeHtml(name || "—")}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Subject:</strong> ${escapeHtml(subject || "—")}</p><p><strong>Message:</strong></p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
      });
      return NextResponse.json({ ok: true });
    }

    if (type === "newsletter") {
      const email = body.email?.trim();
      if (!email) {
        return NextResponse.json({ error: "Missing email" }, { status: 400 });
      }
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: toEmail,
        subject: "[Newsletter] New signup: " + email,
        text: `New newsletter signup: ${email}`,
        html: `<p>New newsletter signup: <strong>${escapeHtml(email)}</strong></p>`,
      });
      return NextResponse.json({ ok: true });
    }

    if (type === "share-coupon") {
      const { fullName, email, storeLabel, couponType, promoCode, couponDescription, couponExpiration } = body;
      const subject = `[Share Coupon] ${storeLabel || "Unknown store"} – ${fullName || "Unknown"}`;
      const text = [
        `Name: ${fullName || "—"}`,
        `Email: ${email || "—"}`,
        `Store: ${storeLabel || "—"}`,
        `Coupon type: ${couponType || "—"}`,
        `Promo code: ${promoCode || "—"}`,
        `Description: ${couponDescription || "—"}`,
        `Expiration: ${couponExpiration || "—"}`,
      ].join("\n");
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: toEmail,
        replyTo: email || undefined,
        subject,
        text,
        html: `<p>${text.replace(/\n/g, "<br>")}</p>`,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown form type. Use type: contact | newsletter | share-coupon" }, { status: 400 });
  } catch (err) {
    console.error("Send email error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send email" },
      { status: 500 }
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
