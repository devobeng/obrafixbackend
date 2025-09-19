import mongoose, { Document, Schema } from "mongoose";

export interface IBanner extends Document {
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  type: "banner" | "promotion" | "announcement";
  targetAudience: "all" | "customers" | "providers" | "specific";
  targetRoles?: string[];
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  priority: number;
  displayOrder: number;
  clickCount: number;
  viewCount: number;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    title: {
      type: String,
      required: [true, "Banner title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    imageUrl: {
      type: String,
      required: [true, "Banner image URL is required"],
    },
    linkUrl: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["banner", "promotion", "announcement"],
      default: "banner",
    },
    targetAudience: {
      type: String,
      enum: ["all", "customers", "providers", "specific"],
      default: "all",
    },
    targetRoles: [
      {
        type: String,
        enum: ["customer", "provider", "admin"],
      },
    ],
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 1,
      min: [1, "Priority must be at least 1"],
      max: [10, "Priority cannot exceed 10"],
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
bannerSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
bannerSchema.index({ targetAudience: 1, isActive: 1 });
bannerSchema.index({ type: 1, isActive: 1 });
bannerSchema.index({ displayOrder: 1, priority: 1 });

// Virtual for checking if banner is currently active
bannerSchema.virtual("isCurrentlyActive").get(function () {
  const now = new Date();
  return (
    this.isActive &&
    this.startDate <= now &&
    (!this.endDate || this.endDate >= now)
  );
});

// Pre-save middleware to validate dates
bannerSchema.pre("save", function (next) {
  if (this.endDate && this.startDate >= this.endDate) {
    return next(new Error("End date must be after start date"));
  }
  next();
});

// Method to increment view count
bannerSchema.methods["incrementViewCount"] = function () {
  this["viewCount"] += 1;
  return this["save"]();
};

// Method to increment click count
bannerSchema.methods["incrementClickCount"] = function () {
  this["clickCount"] += 1;
  return this["save"]();
};

// Static method to get active banners for a specific audience
bannerSchema.statics["getActiveBanners"] = function (
  audience: string,
  roles?: string[]
) {
  const now = new Date();
  const query: any = {
    isActive: true,
    startDate: { $lte: now },
    $or: [{ endDate: { $exists: false } }, { endDate: { $gte: now } }],
  };

  if (audience === "specific" && roles && roles.length > 0) {
    query.targetAudience = "specific";
    query.targetRoles = { $in: roles };
  } else if (audience !== "all") {
    query.targetAudience = audience;
  }

  return this.find(query)
    .sort({ displayOrder: 1, priority: -1, createdAt: -1 })
    .populate("createdBy", "firstName lastName");
};

export const Banner = mongoose.model<IBanner>("Banner", bannerSchema);
