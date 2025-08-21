import mongoose, { Schema } from "mongoose";
import { IServiceReview } from "../types";

// Mongoose schema
const serviceReviewSchema = new Schema<IServiceReview>(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Service ID is required"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
      minlength: [10, "Comment must be at least 10 characters long"],
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
    isVerified: {
      type: Boolean,
      default: false,
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
serviceReviewSchema.index({ serviceId: 1 });
serviceReviewSchema.index({ userId: 1 });
serviceReviewSchema.index({ rating: 1 });
serviceReviewSchema.index({ createdAt: -1 });
serviceReviewSchema.index({ serviceId: 1, userId: 1 }, { unique: true }); // One review per user per service

// Static method to find reviews by service
serviceReviewSchema.statics["findByService"] = function (serviceId: string) {
  return this.find({ serviceId })
    .populate("userId", "firstName lastName profileImage")
    .sort({ createdAt: -1 });
};

// Static method to find reviews by user
serviceReviewSchema.statics["findByUser"] = function (userId: string) {
  return this.find({ userId })
    .populate("serviceId", "title category")
    .sort({ createdAt: -1 });
};

// Static method to get average rating for a service
serviceReviewSchema.statics["getAverageRating"] = function (serviceId: string) {
  return this.aggregate([
    { $match: { serviceId: new mongoose.Types.ObjectId(serviceId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);
};

// Define interface for static methods
interface IServiceReviewModel extends mongoose.Model<IServiceReview> {
  findByService(serviceId: string): Promise<IServiceReview[]>;
  findByUser(userId: string): Promise<IServiceReview[]>;
  getAverageRating(serviceId: string): Promise<any[]>;
}

export const ServiceReview = mongoose.model<IServiceReview, IServiceReviewModel>(
  "ServiceReview",
  serviceReviewSchema
);
export default ServiceReview;
