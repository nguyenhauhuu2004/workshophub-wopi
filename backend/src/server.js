import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./libs/db.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import cookieParser from "cookie-parser";
import { protectedRoute } from "./middlewares/authMiddleware.js";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import workshopRoutes from "./routes/workshopRoutes.js";
import hostRoutes from "./routes/hostRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import promotionRoutes from "./routes/promotionRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Configuration cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// public routes
app.use("/api/auth", authRoute);
app.use("/api/workshops", workshopRoutes);
// private routes
app.use(protectedRoute);
app.use("/api/users", userRoute);
app.use("/api/host", hostRoutes);

app.use("/api/bookings", bookingRoutes);
app.use("/api/promotions", promotionRoutes);
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`server bắt đầu trên cổng ${PORT}`);
  });
});
