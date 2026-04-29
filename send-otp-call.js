import twilio from "twilio";

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  OTP_RECIPIENT_PHONE_NUMBER,
} = process.env;

const requiredEnv = {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  OTP_RECIPIENT_PHONE_NUMBER,
};

const missingEnv = Object.entries(requiredEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
  console.error("Set them locally before running: node send-otp-call.js");
  process.exit(1);
}

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const otp = Math.floor(1000 + Math.random() * 9000).toString();

function maskPhone(phoneNumber) {
  return phoneNumber.replace(/\d(?=\d{2})/g, "*");
}

async function makeCall() {
  const spokenOtp = otp.split("").join(" ");

  console.log(`Attempting OTP call to ${maskPhone(OTP_RECIPIENT_PHONE_NUMBER)}...`);

  try {
    const call = await client.calls.create({
      twiml: `<Response><Say>Hello from your Hackathon app. Your verification code is ${spokenOtp}. I repeat, your code is ${spokenOtp}.</Say></Response>`,
      to: OTP_RECIPIENT_PHONE_NUMBER,
      from: TWILIO_PHONE_NUMBER,
    });

    console.log("Call initiated successfully.");
    console.log(`Call SID: ${call.sid}`);
  } catch (error) {
    console.error("Failed to make the call:");
    console.error(error.message);
    process.exitCode = 1;
  }
}

makeCall();
