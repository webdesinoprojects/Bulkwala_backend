import Twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

const client = Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendOtpSms = async (phone) => {
  try {
    const result = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: `+91${phone}`,
        channel: "sms",
      });

    console.log("✅ OTP sent via Twilio:", result.status);
    return result.status;
  } catch (error) {
    console.error("❌ Twilio Verify Send Error:", error);
    throw new Error("Failed to send OTP via Twilio Verify");
  }
};

export const verifyOtpSms = async (phone, otp) => {
  try {
    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: `+91${phone}`,
        code: otp,
      });

    console.log("✅ Verification Check:", verificationCheck.status);
    return verificationCheck.status === "approved";
  } catch (error) {
    console.error("❌ Twilio Verify Check Error:", error);
    throw new Error("Failed to verify OTP via Twilio Verify");
  }
};
