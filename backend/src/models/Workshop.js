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

const locationSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      trim: true,
    },

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
            return Array.isArray(value) && value.length === 2;
          },
          message: "Tọa độ phải có dạng [longitude, latitude]",
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

    category: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    thumbnail: mediaSchema,
    gallery: [mediaSchema],
    video: mediaSchema,

    highlights: [String],
    includes: [String],

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    duration: String,

    seatsTotal: {
      type: Number,
      required: true,
      min: 1,
    },

    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "All Levels"],
    },

    schedules: [
      {
        date: Date,
        time: String,
        spotsLeft: Number,
      },
    ],

    location: {
      type: locationSchema,
      required: true,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },
  },
  {
    timestamps: true,
  },
);
workshopSchema.index({
  "location.coordinates": "2dsphere",
});
