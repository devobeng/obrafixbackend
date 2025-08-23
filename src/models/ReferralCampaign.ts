import mongoose, { Document, Schema } from "mongoose";

export interface IReferralCampaign extends Document {
  title: string;
  description: string;
  type: "referrer_reward" | "referee_reward" | "both";
  referrerReward: {
    type: "percentage" | "fixed" | "bonus";
    value: number;
    description: string;
  };
  refereeReward: {
    type: "percentage" | "fixed" | "bonus";
    value: number;
    description: string;
  };
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  targetAudience: "all" | "customers" | "providers" | "specific";
  targetRoles?: string[];
  minimumReferrals?: number;
  maximumReferrals?: number;
  referralCodeLength: number;
  terms: string[];
  conditions: string[];
  imageUrl?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const referralCampaignSchema = new Schema<IReferralCampaign>(
  {
    title: {
      type: String,
      required: [true, "Campaign title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Campaign description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    type: {
      type: String,
      enum: ["referrer_reward", "referee_reward", "both"],
      required: true,
    },
    referrerReward: {
      type: {
        type: String,
        enum: ["percentage", "fixed", "bonus"],
        required: true,
      },
      value: {
        type: Number,
        required: true,
        min: [0, "Reward value must be positive"],
      },
      description: {
        type: String,
        required: true,
        trim: true,
      },
    },
    refereeReward: {
      type: {
        type: String,
        enum: ["percentage", "fixed", "bonus"],
        required: true,
      },
      value: {
        type: Number,
        required: true,
        min: [0, "Reward value must be positive"],
      },
      description: {
        type: String,
        required: true,
        trim: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      default: Date.now,
    },
    endDate: {
      type: Date,
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
    minimumReferrals: {
      type: Number,
      min: [1, "Minimum referrals must be at least 1"],
    },
    maximumReferrals: {
      type: Number,
      min: [1, "Maximum referrals must be at least 1"],
    },
    referralCodeLength: {
      type: Number,
      default: 8,
      min: [6, "Referral code length must be at least 6"],
      max: [12, "Referral code length cannot exceed 12"],
    },
    terms: [
      {
        type: String,
        trim: true,
      },
    ],
    conditions: [
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
referralCampaignSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
referralCampaignSchema.index({ targetAudience: 1, isActive: 1 });
referralCampaignSchema.index({ type: 1, isActive: 1 });

// Virtual for checking if campaign is currently active
referralCampaignSchema.virtual("isCurrentlyActive").get(function () {
  const now = new Date();
  return (
    this.isActive &&
    this.startDate <= now &&
    (!this.endDate || this.endDate >= now)
  );
});

// Pre-save middleware to validate dates
referralCampaignSchema.pre("save", function (next) {
  if (this.endDate && this.startDate >= this.endDate) {
    return next(new Error("End date must be after start date"));
  }

  if (
    this.minimumReferrals &&
    this.maximumReferrals &&
    this.minimumReferrals > this.maximumReferrals
  ) {
    return next(new Error("Minimum referrals cannot exceed maximum referrals"));
  }

  next();
});

// Static method to get active campaigns for a specific audience
referralCampaignSchema.statics.getActiveCampaigns = function (
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
    .sort({ startDate: -1 })
    .populate("createdBy", "firstName lastName");
};

// Method to generate referral code
referralCampaignSchema.methods.generateReferralCode = function (
  userId: string
) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < this.referralCodeLength; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${code}${userId.slice(-4)}`;
};

export const ReferralCampaign = mongoose.model<IReferralCampaign>(
  "ReferralCampaign",
  referralCampaignSchema
);
