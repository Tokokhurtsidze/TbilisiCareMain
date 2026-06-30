import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await transporter.sendMail({
    from: `"TbilisiCare" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Welcome to TbilisiCare! 🌿",
    text: `Hi ${name || "there"},\n\nWelcome to TbilisiCare! You've joined a community of Tbilisi residents making the city better through everyday good deeds.\n\nStart earning CarePoints by submitting your first deed at tbilisicare.ge/app/submit\n\nThank you for caring,\nThe TbilisiCare Team`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1a2e">
        <h2 style="color:#2563eb">Welcome to TbilisiCare!</h2>
        <p>Hi <strong>${name || "there"}</strong>,</p>
        <p>You've joined a community of Tbilisi residents making the city better through everyday good deeds.</p>
        <p>Start earning <strong>CarePoints</strong> by submitting your first deed:</p>
        <a href="https://tbilisicare.ge/app/submit"
           style="display:inline-block;margin:16px 0;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Submit a deed
        </a>
        <p style="color:#666;font-size:14px">Thank you for caring about Tbilisi.<br/>— The TbilisiCare Team</p>
      </div>
    `,
  });
}

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  await transporter.sendMail({
    from: `"TbilisiCare Admin" <${process.env.GMAIL_USER}>`,
    to,
    subject: "TbilisiCare Admin — Your Login Code",
    text: `Your admin login code is: ${otp}\n\nExpires in 10 minutes. Do not share this code.`,
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto">
        <h2 style="color:#1a1a2e">TbilisiCare Admin Login</h2>
        <p>Your one-time login code:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#2563eb;padding:16px 0">
          ${otp}
        </div>
        <p style="color:#666;font-size:14px">Expires in 10 minutes. Do not share this code.</p>
      </div>
    `,
  });
}
