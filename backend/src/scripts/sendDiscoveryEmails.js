import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../libs/db.js";
import { runDiscoveryEmailNotification } from "../services/notificationScheduler.js";

async function main() {
  console.log("Connecting to database...");
  await connectDB();
  console.log("Running discovery email notification...");
  const result = await runDiscoveryEmailNotification();
  console.log("Result:", result);
  await mongoose.disconnect();
  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Discovery email script error:", err);
  process.exit(1);
});
