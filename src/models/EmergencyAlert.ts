import mongoose, { Schema } from "mongoose";

export interface IEmergencyAlert extends Document {
  _id: string;
  userId: string;
  alertType: "sos" | "safety_check" | "emergency_contact" | "location_share";
  status: "active" | "resolved" | "false_alarm";
  priority: "low" | "medium" | "high" | "critical";
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
    timestamp: Date;
  };
  description: string;
  emergencyContacts: string[];
  isActive: boolean;
  activatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
  responseTime?: number; // in seconds
  escalatedTo: string[]; // admin IDs or emergency services
  metadata: {
    deviceInfo?: string;
    batteryLevel?: number;
    networkSignal?: string;
    lastKnownLocation?: {
      latitude: number;
      longitude: number;
      timestamp: Date;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const emergencyAlertSchema = new Schema<IEmergencyAlert>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    alertType: {
      type: String,
      required: [true, "Alert type is required"],
      enum: ["sos", "safety_check", "emergency_contact", "location_share"],
      default: "sos",
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["active", "resolved", "false_alarm"],
      default: "active",
    },
    priority: {
      type: String,
      required: [true, "Priority is required"],
      enum: ["low", "medium", "high", "critical"],
      default: "critical",
    },
    location: {
      latitude: {
        type: Number,
        required: [true, "Latitude is required"],
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        required: [true, "Longitude is required"],
        min: -180,
        max: 180,
      },
      address: {
        type: String,
        maxlength: [500, "Address cannot exceed 500 characters"],
      },
      accuracy: {
        type: Number,
        min: 0,
        max: 100,
      },
      timestamp: {
        type: Date,
        required: [true, "Location timestamp is required"],
        default: Date.now,
      },
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    emergencyContacts: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    activatedAt: {
      type: Date,
      required: [true, "Activation time is required"],
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    resolutionNotes: {
      type: String,
      maxlength: [1000, "Resolution notes cannot exceed 1000 characters"],
    },
    responseTime: {
      type: Number,
      min: 0,
    },
    escalatedTo: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    metadata: {
      deviceInfo: {
        type: String,
        maxlength: [200, "Device info cannot exceed 200 characters"],
      },
      batteryLevel: {
        type: Number,
        min: 0,
        max: 100,
      },
      networkSignal: {
        type: String,
        maxlength: [50, "Network signal cannot exceed 50 characters"],
      },
      lastKnownLocation: {
        latitude: {
          type: Number,
          min: -90,
          max: 90,
        },
        longitude: {
          type: Number,
          min: -180,
          max: 180,
        },
        timestamp: {
          type: Date,
        },
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

// Pre-save middleware to set priority based on alert type
emergencyAlertSchema.pre("save", function (next) {
  if (this.alertType === "sos") {
    this.priority = "critical";
  }

  // Calculate response time if resolved
  if (this.status === "resolved" && this.activatedAt && !this.responseTime) {
    this.responseTime = Math.floor(
      (this.resolvedAt!.getTime() - this.activatedAt.getTime()) / 1000
    );
  }

  next();
});

// Indexes for better query performance
emergencyAlertSchema.index({ userId: 1, status: 1 });
emergencyAlertSchema.index({ status: 1, priority: -1, activatedAt: -1 });
emergencyAlertSchema.index({ alertType: 1, status: 1 });
emergencyAlertSchema.index({ isActive: 1, priority: -1 });
emergencyAlertSchema.index({ location: "2dsphere" }); // Geospatial index
emergencyAlertSchema.index({ escalatedTo: 1, status: 1 });

// Static method to find active alerts by user
emergencyAlertSchema.statics.findActiveByUser = function (userId: string) {
  return this.find({ userId, status: "active", isActive: true })
    .sort({ activatedAt: -1 })
    .populate("emergencyContacts", "firstName lastName phone email");
};

// Static method to find critical alerts
emergencyAlertSchema.statics.findCritical = function () {
  return this.find({
    priority: "critical",
    status: "active",
    isActive: true,
  })
    .sort({ activatedAt: -1 })
    .populate("userId", "firstName lastName phone email")
    .populate("emergencyContacts", "firstName lastName phone email");
};

// Static method to find nearby alerts
emergencyAlertSchema.statics.findNearby = function (
  latitude: number,
  longitude: number,
  maxDistance: number = 10000
) {
  return this.find({
    status: "active",
    isActive: true,
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance,
      },
    },
  })
    .sort({ priority: -1, activatedAt: -1 })
    .populate("userId", "firstName lastName phone email")
    .limit(20);
};

// Static method to get emergency statistics
emergencyAlertSchema.statics.getStatistics = function () {
  return this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        criticalCount: {
          $sum: { $cond: [{ $eq: ["$priority", "critical"] }, 1, 0] },
        },
        avgResponseTime: { $avg: "$responseTime" },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// Static method to get alert type statistics
emergencyAlertSchema.statics.getAlertTypeStatistics = function () {
  return this.aggregate([
    {
      $group: {
        _id: "$alertType",
        count: { $sum: 1 },
        activeCount: {
          $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
        },
        criticalCount: {
          $sum: { $cond: [{ $eq: ["$priority", "critical"] }, 1, 0] },
        },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// Define interface for static methods
interface IEmergencyAlertModel extends mongoose.Model<IEmergencyAlert> {
  findActiveByUser(userId: string): Promise<IEmergencyAlert[]>;
  findCritical(): Promise<IEmergencyAlert[]>;
  findNearby(
    latitude: number,
    longitude: number,
    maxDistance?: number
  ): Promise<IEmergencyAlert[]>;
  getStatistics(): Promise<any[]>;
  getAlertTypeStatistics(): Promise<any[]>;
}

export const EmergencyAlert = mongoose.model<
  IEmergencyAlert,
  IEmergencyAlertModel
>("EmergencyAlert", emergencyAlertSchema);

export default EmergencyAlert;
