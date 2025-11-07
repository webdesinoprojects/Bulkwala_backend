import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const sendOtpSms = async (phone, otp) => {
  try {
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "otp",
        variables_values: otp,
        numbers: phone,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Fast2SMS response:", response.data);
    if (!response.data.return) {
      throw new Error(response.data.message || "Fast2SMS failed");
    }

    return true;
  } catch (error) {
    console.error("❌ Fast2SMS Error:", error.response?.data || error.message);
    throw new Error("Failed to send OTP via Fast2SMS");
  }
};
