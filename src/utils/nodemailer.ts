import 'dotenv/config';
import nodemailer from 'nodemailer';

const { NODEMAILER_EMAIL, NODEMAILER_PASSWORD } = process.env;

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: NODEMAILER_EMAIL,
    pass: NODEMAILER_PASSWORD,
  },
});

interface FormData {
  email: string;
}

export async function transportMail(formData: FormData) {
  try {
    const info = await transporter.sendMail({
      from: 'QuickMnemo <no-reply@quickmnemo.com>',
      to: formData.email,
      subject: 'Welcome to QuickMnemo Premium Membership!',
      html: generatePremiumMembershipEmail(),
    });

    return info;
  } catch (error) {
    throw error;
  }
}

export const generatePremiumMembershipEmail = function () {
  // Get current date and format it
  const currentDate = new Date();
  const billingDate = currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6;">
      <div style="background-color: #f4f4f4; padding: 20px;">
        <h1 style="color: #4CAF50; text-align: center;">Welcome to QuickMnemo Premium!</h1>
      </div>
      <div style="padding: 20px;">
        <p>Dear Customer,</p>
        <p>We are thrilled to inform you that your payment has been successfully processed, and you are now a Premium Member of QuickMnemo!</p>
        <p>As a Premium Member, you now have access to exclusive features and benefits that are designed to enhance your experience. We encourage you to explore and take full advantage of these premium services.</p>
        <p><strong>Important Reminder:</strong> Please note that this is a recurring payment. Your subscription will automatically renew every month on the <strong>${billingDate}</strong>.</p>
        <p>If you have any questions about your membership or the billing process, our support team is here to assist you. You can reach us at <a href="mailto:support@quickmnemo.com" style="color: #4CAF50;">support@quickmnemo.com</a>.</p>
        <p>Thank you for choosing QuickMnemo. We are excited to have you on board as a Premium Member and look forward to providing you with the best possible experience.</p>
        <p>Best regards,</p>
        <p><strong>QuickMnemo Team</strong></p>
      </div>
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #777;">
        <p>This email confirms your Premium Membership and recurring payment plan on QuickMnemo.</p>
        <p>If you did not authorize this payment, or if you wish to cancel your subscription, please contact our support team immediately.</p>
        <p>&copy; ${currentDate.getFullYear()} QuickMnemo. All rights reserved.</p>
      </div>
    </div>
  `;
};
