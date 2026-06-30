import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

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
