import mongoose, { Schema } from "mongoose";

export interface IVendorReview extends Document {
  _id: string;
  vendorId: string;
  userId: string;
  bookingId: string;
  jobRating: number;
  communicationRating: number;
  punctualityRating: number;
  qualityRating: number;
  overallRating: number;
  comment: string;
  images: string[];
  isVerified: boolean;
  isPublic: boolean;
  helpfulCount: number;
  reportCount: number;
  helpfulUsers: string[];
  reportedUsers: string[];
  providerResponse?: {
    comment: string;
    createdAt: Date;
    updatedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const vendorReviewSchema = new Schema<IVendorReview>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Vendor ID is required"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking ID is required"],
    },
    jobRating: {
      type: Number,
      required: [true, "Job quality rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    communicationRating: {
      type: Number,
      required: [true, "Communication rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    punctualityRating: {
      type: Number,
      required: [true, "Punctuality rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    qualityRating: {
      type: Number,
      required: [true, "Quality rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    overallRating: {
      type: Number,
      required: [true, "Overall rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      minlength: [10, "Comment must be at least 10 characters long"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    images: [
      {
        type: String,
        validate: {
          validator: function (v: string) {
            return /^https?:\/\/.+/.test(v);
          },
          message: "Image URL must be a valid HTTP/HTTPS URL",
        },
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    helpfulUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    reportedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    providerResponse: {
      comment: {
        type: String,
        trim: true,
        maxlength: [1000, "Provider response cannot exceed 1000 characters"],
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
      },
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

// Pre-save middleware to calculate overall rating
vendorReviewSchema.pre("save", function (next) {
  if (
    this.isModified("jobRating") ||
    this.isModified("communicationRating") ||
    this.isModified("punctualityRating") ||
    this.isModified("qualityRating")
  ) {
    this.overallRating = Math.round(
      (this.jobRating +
        this.communicationRating +
        this.punctualityRating +
        this.qualityRating) /
        4
    );
  }
  next();
});

// Indexes for better query performance
vendorReviewSchema.index({ vendorId: 1 });
vendorReviewSchema.index({ userId: 1 });
vendorReviewSchema.index({ bookingId: 1 }, { unique: true }); // One review per booking
vendorReviewSchema.index({ overallRating: -1 });
vendorReviewSchema.index({ createdAt: -1 });
vendorReviewSchema.index({ isPublic: 1 });

// Static method to find reviews by vendor
vendorReviewSchema.statics.findByVendor = function (
  vendorId: string,
  limit = 10,
  skip = 0
) {
  return this.find({ vendorId, isPublic: true })
    .populate("userId", "firstName lastName profileImage")
    .populate("bookingId", "serviceId scheduledDate")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to find reviews by user
vendorReviewSchema.statics.findByUser = function (userId: string) {
  return this.find({ userId })
    .populate("vendorId", "firstName lastName profileImage")
    .populate("bookingId", "serviceId scheduledDate")
    .sort({ createdAt: -1 });
};

// Static method to get average ratings for a vendor
vendorReviewSchema.statics.getAverageRatings = function (vendorId: string) {
  return this.aggregate([
    {
      $match: {
        vendorId: new mongoose.Types.ObjectId(vendorId),
        isPublic: true,
      },
    },
    {
      $group: {
        _id: null,
        averageJobRating: { $avg: "$jobRating" },
        averageCommunicationRating: { $avg: "$communicationRating" },
        averagePunctualityRating: { $avg: "$punctualityRating" },
        averageQualityRating: { $avg: "$qualityRating" },
        averageOverallRating: { $avg: "$overallRating" },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: "$overallRating",
        },
      },
    },
  ]);
};

// Static method to get rating distribution
vendorReviewSchema.statics.getRatingDistribution = function (vendorId: string) {
  return this.aggregate([
    {
      $match: {
        vendorId: new mongoose.Types.ObjectId(vendorId),
        isPublic: true,
      },
    },
    {
      $group: {
        _id: "$overallRating",
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ]);
};

// Define interface for static methods
interface IVendorReviewModel extends mongoose.Model<IVendorReview> {
  findByVendor(
    vendorId: string,
    limit?: number,
    skip?: number
  ): Promise<IVendorReview[]>;
  findByUser(userId: string): Promise<IVendorReview[]>;
  getAverageRatings(vendorId: string): Promise<any[]>;
  getRatingDistribution(vendorId: string): Promise<any[]>;
}

export const VendorReview = mongoose.model<IVendorReview, IVendorReviewModel>(
  "VendorReview",
  vendorReviewSchema
);

export default VendorReview;
