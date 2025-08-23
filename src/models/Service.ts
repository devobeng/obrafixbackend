import mongoose, { Schema } from "mongoose";
import { IService } from "../types";

// Mongoose schema
const serviceSchema = new Schema<IService>(
  {
    title: {
      type: String,
      required: [true, "Service title is required"],
      trim: true,
      minlength: [3, "Service title must be at least 3 characters long"],
      maxlength: [100, "Service title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Service description is required"],
      trim: true,
      minlength: [
        10,
        "Service description must be at least 10 characters long",
      ],
      maxlength: [1000, "Service description cannot exceed 1000 characters"],
    },
    category: {
      type: String,
      required: [true, "Service category is required"],
      trim: true,
      enum: {
        values: [
          "cleaning",
          "plumbing",
          "electrical",
          "carpentry",
          "gardening",
          "painting",
          "moving",
          "repair",
          "maintenance",
          "other",
        ],
        message: "Invalid service category",
      },
    },
    subcategory: {
      type: String,
      trim: true,
    },
    pricing: {
      type: {
        type: String,
        enum: ["hourly", "fixed", "negotiable"],
        required: [true, "Pricing type is required"],
      },
      amount: {
        type: Number,
        required: [true, "Price amount is required"],
        min: [0, "Price cannot be negative"],
      },
      currency: {
        type: String,
        default: "GHS",
        enum: ["GHS", "USD", "EUR"],
      },
      unit: {
        type: String,
        trim: true,
      },
    },
    provider: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Service provider is required"],
    },
    location: {
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      state: {
        type: String,
        required: [true, "State is required"],
        trim: true,
      },
      country: {
        type: String,
        required: [true, "Country is required"],
        trim: true,
      },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
      serviceRadius: {
        type: Number,
        required: [true, "Service radius is required"],
        min: [1, "Service radius must be at least 1km"],
        max: [100, "Service radius cannot exceed 100km"],
        default: 10,
      },
    },
    images: [
      {
        url: {
          type: String,
          required: true,
          trim: true,
        },
        alt: {
          type: String,
          trim: true,
        },
      },
    ],
    availability: {
      isAvailable: {
        type: Boolean,
        default: true,
      },
      workingDays: [
        {
          day: {
            type: String,
            enum: [
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ],
          },
          startTime: String,
          endTime: String,
          isAvailable: {
            type: Boolean,
            default: true,
          },
        },
      ],
      emergencyService: {
        type: Boolean,
        default: false,
      },
      noticeRequired: {
        type: Number,
        min: [0, "Notice required cannot be negative"],
        default: 24,
      },
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
      reviews: [
        {
          userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
          },
          comment: {
            type: String,
            required: true,
            trim: true,
            maxlength: [500, "Review comment cannot exceed 500 characters"],
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    tags: [String],
    requirements: [String],
    estimatedDuration: {
      type: String,
      trim: true,
    },
    // Enhanced provider preferences
    providerPreferences: {
      maxDistance: {
        type: Number,
        min: [1, "Maximum distance must be at least 1km"],
        max: [100, "Maximum distance cannot exceed 100km"],
        default: 10,
      },
      preferredWorkingHours: {
        startTime: String,
        endTime: String,
      },
      emergencyServiceAvailable: {
        type: Boolean,
        default: false,
      },
      weekendService: {
        type: Boolean,
        default: false,
      },
      holidayService: {
        type: Boolean,
        default: false,
      },
    },
    // Service scheduling preferences
    scheduling: {
      advanceBookingRequired: {
        type: Number,
        min: [0, "Advance booking time cannot be negative"],
        default: 24, // hours
      },
      maxBookingsPerDay: {
        type: Number,
        min: [1, "Maximum bookings per day must be at least 1"],
        max: [20, "Maximum bookings per day cannot exceed 20"],
        default: 5,
      },
      cancellationPolicy: {
        type: String,
        enum: ["flexible", "moderate", "strict"],
        default: "moderate",
      },
      cancellationNotice: {
        type: Number,
        min: [0, "Cancellation notice cannot be negative"],
        default: 2, // hours
      },
    },
    // Service area and coverage
    coverage: {
      cities: [String],
      neighborhoods: [String],
      postalCodes: [String],
      customAreas: [String],
    },
    // Provider availability status
    availabilityStatus: {
      isOnline: {
        type: Boolean,
        default: true,
      },
      lastSeen: Date,
      autoAccept: {
        type: Boolean,
        default: false,
      },
      autoAcceptRadius: {
        type: Number,
        min: [1, "Auto-accept radius must be at least 1km"],
        max: [50, "Auto-accept radius cannot exceed 50km"],
        default: 5,
      },
    },
    warranty: {
      type: String,
      trim: true,
    },
    commissionRate: {
      type: Number,
      min: [0, "Commission rate cannot be negative"],
      max: [100, "Commission rate cannot exceed 100%"],
      default: 10,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
serviceSchema.index({ title: "text", description: "text", category: "text" });
serviceSchema.index({ provider: 1 });
serviceSchema.index({ category: 1 });
serviceSchema.index({ status: 1 });
serviceSchema.index({ "location.city": 1, "location.state": 1 });
serviceSchema.index({ "pricing.amount": 1 });
serviceSchema.index({ "rating.average": -1 });
serviceSchema.index({ "location.serviceRadius": 1 });
serviceSchema.index({ "availability.workingDays.day": 1 });

// Static method to find services by category
serviceSchema.statics["findByCategory"] = function (category: string) {
  return this.find({ category, status: "active" });
};

// Static method to find services by provider
serviceSchema.statics["findByProvider"] = function (providerId: string) {
  return this.find({ provider: providerId });
};

// Static method to search services
serviceSchema.statics["searchServices"] = function (query: string) {
  return this.find({
    $text: { $search: query },
    status: "active",
  });
};

export const Service = mongoose.model<IService>("Service", serviceSchema);
export default Service;
