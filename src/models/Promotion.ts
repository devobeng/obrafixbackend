import mongoose, { Document, Schema } from "mongoose";

export interface IPromotion extends Document {
  title: string;
  description: string;
  type: "discount" | "cashback" | "free_service" | "bonus" | "referral";
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  minimumAmount?: number;
  maximumDiscount?: number;
  code?: string;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  targetAudience:
    | "all"
    | "customers"
    | "providers"
    | "new_users"
    | "existing_users";
  targetRoles?: string[];
  applicableServices?: mongoose.Types.ObjectId[];
  applicableCategories?: mongoose.Types.ObjectId[];
  usageLimit?: number;
  usageCount: number;
  userUsageLimit?: number;
  conditions?: string[];
  terms?: string[];
  imageUrl?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const promotionSchema = new Schema<IPromotion>(
  {
    title: {
      type: String,
      required: [true, "Promotion title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Promotion description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    type: {
      type: String,
      enum: ["discount", "cashback", "free_service", "bonus", "referral"],
      required: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
    },
    discountValue: {
      type: Number,
      min: [0, "Discount value must be positive"],
    },
    minimumAmount: {
      type: Number,
      min: [0, "Minimum amount must be positive"],
    },
    maximumDiscount: {
      type: Number,
      min: [0, "Maximum discount must be positive"],
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    targetAudience: {
      type: String,
      enum: ["all", "customers", "providers", "new_users", "existing_users"],
      default: "all",
    },
    targetRoles: [
      {
        type: String,
        enum: ["customer", "provider", "admin"],
      },
    ],
    applicableServices: [
      {
        type: Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    applicableCategories: [
      {
        type: Schema.Types.ObjectId,
        ref: "ServiceCategory",
      },
    ],
    usageLimit: {
      type: Number,
      min: [1, "Usage limit must be at least 1"],
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    userUsageLimit: {
      type: Number,
      min: [1, "User usage limit must be at least 1"],
    },
    conditions: [
      {
        type: String,
        trim: true,
      },
    ],
    terms: [
      {
        type: String,
        trim: true,
      },
    ],
    imageUrl: {
      type: String,
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
promotionSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
promotionSchema.index({ code: 1 });
promotionSchema.index({ targetAudience: 1, isActive: 1 });
promotionSchema.index({ type: 1, isActive: 1 });

// Virtual for checking if promotion is currently active
promotionSchema.virtual("isCurrentlyActive").get(function () {
  const now = new Date();
  return (
    this.isActive &&
    this.startDate <= now &&
    this.endDate >= now &&
    (!this.usageLimit || this.usageCount < this.usageLimit)
  );
});

// Virtual for remaining usage
promotionSchema.virtual("remainingUsage").get(function () {
  if (!this.usageLimit) return null;
  return Math.max(0, this.usageLimit - this.usageCount);
});

// Pre-save middleware to validate dates and generate code
promotionSchema.pre("save", function (next) {
  if (this.startDate >= this.endDate) {
    return next(new Error("End date must be after start date"));
  }

  // Generate unique code if not provided
  if (!this.code && this.type === "discount") {
    this.code = this.generateUniqueCode();
  }

  next();
});

// Method to generate unique promotion code
promotionSchema.methods.generateUniqueCode = function () {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Method to increment usage count
promotionSchema.methods.incrementUsage = function () {
  this.usageCount += 1;
  return this.save();
};

// Static method to get active promotions for a specific audience
promotionSchema.statics.getActivePromotions = function (
  audience: string,
  roles?: string[]
) {
  const now = new Date();
  const query: any = {
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  };

  if (audience === "specific" && roles && roles.length > 0) {
    query.targetAudience = "specific";
    query.targetRoles = { $in: roles };
  } else if (audience !== "all") {
    query.targetAudience = audience;
  }

  return this.find(query)
    .sort({ startDate: -1 })
    .populate("createdBy", "firstName lastName")
    .populate("applicableServices", "title")
    .populate("applicableCategories", "name");
};

// Static method to validate promotion code
promotionSchema.statics.validateCode = function (
  code: string,
  userId: string,
  amount: number
) {
  const now = new Date();
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).then((promotion) => {
    if (!promotion) {
      throw new Error("Invalid or expired promotion code");
    }

    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      throw new Error("Promotion usage limit reached");
    }

    if (promotion.minimumAmount && amount < promotion.minimumAmount) {
      throw new Error(`Minimum amount of $${promotion.minimumAmount} required`);
    }

    return promotion;
  });
};

export const Promotion = mongoose.model<IPromotion>(
  "Promotion",
  promotionSchema
);
