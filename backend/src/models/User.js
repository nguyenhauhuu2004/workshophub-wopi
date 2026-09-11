import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    hashedPassword: {
      type: String,
      // Not required — Google OAuth users won't have a password
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values without index collision
      lowercase: true,
      trim: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allow null for non-Google users
    },
    displayName: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String, // link CDN để hiển thị hình
    },
    avatarId: {
      type: String, // Cloudinary public_id để xoá hình
    },
    bio: {
      type: String,
      maxlength: 500, // tuỳ
    },
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },
    role: {
      type: String,
      enum: ["user", "host", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      sparse: true, // cho phép null, nhưng không được trùng
    },

    /*
     * Thông tin người tham dự mặc định — được lưu khi người dùng
     * đánh dấu "Lưu thông tin này để dùng lần sau" trong form đặt chỗ.
     * Sẽ tự điền sẵn ở lần đặt chỗ tiếp theo.
     */
    defaultAttendee: {
      name: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, lowercase: true, default: "" },
      phone: { type: String, trim: true, default: "" },
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);
export default User;
