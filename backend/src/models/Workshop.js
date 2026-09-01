import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
  },
  { _id: false },
);

const workshopScheduleSchema = new mongoose.Schema({
  startAt: {
    type: Date,
    required: true,
  },

  endAt: {
    type: Date,
  },

  seatsTotal: {
    type: Number,
    required: true,
    min: 1,
  },

  spotsLeft: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator(value) {
        return value <= this.seatsTotal;
      },
      message: "Số chỗ còn lại không thể lớn hơn tổng số ghế",
    },
  },
});

const locationSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      trim: true,
    },

    ward: { type: String, trim: true, default: "" },
    district: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    province: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "Việt Nam" },
    formattedAddress: { type: String, trim: true, default: "" },

    placeId: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
    },

    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },

      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator(value) {
            if (!Array.isArray(value) || value.length !== 2) return false;

            const [longitude, latitude] = value;

            return (
              Number.isFinite(longitude) &&
              Number.isFinite(latitude) &&
              longitude >= -180 &&
              longitude <= 180 &&
              latitude >= -90 &&
              latitude <= 90
            );
          },
          message: "Tọa độ phải có dạng [longitude, latitude] hợp lệ",
        },
      },
    },
  },
  { _id: false },
);

const workshopSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    categories: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      required: true,
      validate: {
        validator: (value) => value.length > 0,
        message: "Workshop phải có ít nhất một danh mục",
      },
    },

    description: {
      type: String,
      required: true,
    },

    thumbnail: {
      type: mediaSchema,
      validate: {
        validator: (value) => value == null || value.resourceType === "image",
        message: "Thumbnail phải là hình ảnh",
      },
    },

    gallery: {
      type: [mediaSchema],
      default: [],
      validate: {
        validator: (items) =>
          items.every((item) => item.resourceType === "image"),
        message: "Gallery chỉ được chứa hình ảnh",
      },
    },

    video: {
      type: mediaSchema,
      validate: {
        validator: (value) => value == null || value.resourceType === "video",
        message: "Video phải có resourceType là video",
      },
    },

    highlights: [String],
    includes: [String],

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    duration: String,

    schedules: {
      type: [workshopScheduleSchema],
      default: [],
    },

    location: {
      type: locationSchema,
      required: true,
    },

    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "archived"],
      default: "published",
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    nextScheduleStartAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);
workshopSchema.index({
  "location.coordinates": "2dsphere",
});
workshopSchema.index({ "location.city": 1 });
workshopSchema.index({ "location.district": 1 });
workshopSchema.index({ nextScheduleStartAt: 1 });

const Workshop = mongoose.model("Workshop", workshopSchema);
export default Workshop;
