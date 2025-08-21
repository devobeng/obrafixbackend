import mongoose, { Schema } from "mongoose";

export interface IFAQ extends Document {
  _id: string;
  question: string;
  answer: string;
  category: "general" | "booking" | "payment" | "safety" | "technical" | "refunds";
  subcategory?: string;
  tags: string[];
  isActive: boolean;
  priority: "low" | "medium" | "high";
  helpfulCount: number;
  notHelpfulCount: number;
  lastUpdated: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new Schema<IFAQ>(
  {
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
      minlength: [10, "Question must be at least 10 characters long"],
      maxlength: [500, "Question cannot exceed 500 characters"],
    },
    answer: {
      type: String,
      required: [true, "Answer is required"],
      trim: true,
      minlength: [20, "Answer must be at least 20 characters long"],
      maxlength: [2000, "Answer cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["general", "booking", "payment", "safety", "technical", "refunds"],
      default: "general",
    },
    subcategory: {
      type: String,
      trim: true,
      maxlength: [100, "Subcategory cannot exceed 100 characters"],
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [50, "Tag cannot exceed 50 characters"],
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    notHelpfulCount: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
faqSchema.index({ category: 1, isActive: 1 });
faqSchema.index({ subcategory: 1, isActive: 1 });
faqSchema.index({ tags: 1, isActive: 1 });
faqSchema.index({ priority: -1, helpfulCount: -1 });
faqSchema.index({ isActive: 1, lastUpdated: -1 });

// Static method to find FAQs by category
faqSchema.statics.findByCategory = function(category: string, subcategory?: string) {
  const query: any = { category, isActive: true };
  if (subcategory) query.subcategory = subcategory;
  
  return this.find(query)
    .sort({ priority: -1, helpfulCount: -1, lastUpdated: -1 });
};

// Static method to search FAQs
faqSchema.statics.search = function(searchTerm: string, category?: string) {
  const query: any = {
    isActive: true,
    $or: [
      { question: { $regex: searchTerm, $options: "i" } },
      { answer: { $regex: searchTerm, $options: "i" } },
      { tags: { $in: [new RegExp(searchTerm, "i")] } }
    ]
  };
  
  if (category) query.category = category;
  
  return this.find(query)
    .sort({ priority: -1, helpfulCount: -1 })
    .limit(20);
};

// Static method to get popular FAQs
faqSchema.statics.getPopular = function(limit: number = 10) {
  return this.find({ isActive: true })
    .sort({ helpfulCount: -1, notHelpfulCount: 1 })
    .limit(limit);
};

// Static method to get FAQ categories with counts
faqSchema.statics.getCategoriesWithCounts = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        subcategories: {
          $addToSet: "$subcategory"
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Define interface for static methods
interface IFAQModel extends mongoose.Model<IFAQ> {
  findByCategory(category: string, subcategory?: string): Promise<IFAQ[]>;
  search(searchTerm: string, category?: string): Promise<IFAQ[]>;
  getPopular(limit?: number): Promise<IFAQ[]>;
  getCategoriesWithCounts(): Promise<any[]>;
}

export const FAQ = mongoose.model<IFAQ, IFAQModel>("FAQ", faqSchema);
export default FAQ; 