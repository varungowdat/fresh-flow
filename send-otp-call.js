import twilio from "twilio";

export async function sendOtpCall(phoneNumber) {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER,
  } = process.env;

  const requiredEnv = {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER,
  };

  const missingEnv = Object.entries(requiredEnv)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingEnv.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  function maskPhone(phone) {
    return phone.replace(/\d(?=\d{2})/g, "*");
  }

  const spokenOtp = otp.split("").join(" ");

  console.log(`Attempting OTP call to ${maskPhone(phoneNumber)}...`);

  try {
    const call = await client.calls.create({
      twiml: `<Response><Say>Hello from your Hackathon app. Your verification code is ${spokenOtp}. I repeat, your code is ${spokenOtp}.</Say></Response>`,
      to: phoneNumber,
      from: TWILIO_PHONE_NUMBER,
    });

    console.log("Call initiated successfully.");
    console.log(`Call SID: ${call.sid}`);
    
    // Return OTP so it can be verified on the server side
    return { success: true, otp, sid: call.sid };
  } catch (error) {
    console.error("Failed to make the call:", error.message);
    throw error;
  }
}
