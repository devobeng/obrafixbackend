import mongoose, { Schema } from "mongoose";
import { IServiceCategory } from "../types";

// Mongoose schema
const serviceCategorySchema = new Schema<IServiceCategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
      minlength: [2, "Category name must be at least 2 characters long"],
      maxlength: [50, "Category name cannot exceed 50 characters"],
    },
    description: {
      type: String,
      required: [true, "Category description is required"],
      trim: true,
      minlength: [
        10,
        "Category description must be at least 10 characters long",
      ],
      maxlength: [500, "Category description cannot exceed 500 characters"],
    },
    icon: {
      type: String,
      trim: true,
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "ServiceCategory",
    },
    commissionRate: {
      type: Number,
      required: [true, "Commission rate is required"],
      min: [0, "Commission rate cannot be negative"],
      max: [100, "Commission rate cannot exceed 100%"],
      default: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
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
serviceCategorySchema.index({ parentCategory: 1 });
serviceCategorySchema.index({ isActive: 1 });
serviceCategorySchema.index({ sortOrder: 1 });

// Static method to find active categories
serviceCategorySchema.statics["findActiveCategories"] = function () {
  return this.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
};

// Static method to find categories by parent
serviceCategorySchema.statics["findByParent"] = function (parentId: string) {
  return this.find({ parentCategory: parentId, isActive: true }).sort({
    sortOrder: 1,
    name: 1,
  });
};

// Static method to find root categories (no parent)
serviceCategorySchema.statics["findRootCategories"] = function () {
  return this.find({ parentCategory: { $exists: false }, isActive: true }).sort(
    { sortOrder: 1, name: 1 }
  );
};

// Define interface for static methods
interface IServiceCategoryModel extends mongoose.Model<IServiceCategory> {
  findActiveCategories(): Promise<IServiceCategory[]>;
  findByParent(parentId: string): Promise<IServiceCategory[]>;
  findRootCategories(): Promise<IServiceCategory[]>;
}

export const ServiceCategory = mongoose.model<IServiceCategory, IServiceCategoryModel>(
  "ServiceCategory",
  serviceCategorySchema
);
export default ServiceCategory;
