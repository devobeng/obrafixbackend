import mongoose, { Document, Schema } from "mongoose";

export interface IChatMessage extends Document {
  bookingId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  recipientId?: mongoose.Types.ObjectId;
  message: string;
  messageType: "text" | "image" | "file" | "location";
  isRead: boolean;
  readAt?: Date;
  timestamp: Date;
  metadata?: {
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
  };
}

// Add interface for the model with static methods
export interface IChatMessageModel extends mongoose.Model<IChatMessage> {
  getUnreadCount(userId: string, bookingId?: string): Promise<number>;
  getChatHistory(
    bookingId: string,
    limit?: number,
    before?: Date
  ): Promise<IChatMessage[]>;
}

const chatMessageSchema = new Schema<IChatMessage>({
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipientId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  messageType: {
    type: String,
    enum: ["text", "image", "file", "location"],
    default: "text",
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
  },
});

// Indexes for efficient querying
chatMessageSchema.index({ bookingId: 1, timestamp: -1 });
chatMessageSchema.index({ senderId: 1, timestamp: -1 });
chatMessageSchema.index({ recipientId: 1, isRead: 1 });

// Virtual for message age
chatMessageSchema.virtual("age").get(function () {
  return Date.now() - this.timestamp.getTime();
});

// Method to mark as read
chatMessageSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get unread count for a user
chatMessageSchema.statics.getUnreadCount = function (
  userId: string,
  bookingId?: string
) {
  const query: any = { recipientId: userId, isRead: false };
  if (bookingId) query.bookingId = bookingId;

  return this.countDocuments(query);
};

// Static method to get chat history
chatMessageSchema.statics.getChatHistory = function (
  bookingId: string,
  limit = 50,
  before?: Date
) {
  const query: any = { bookingId };
  if (before) query.timestamp = { $lt: before };

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate("senderId", "firstName lastName email profileImage")
    .populate("recipientId", "firstName lastName email profileImage");
};

// Pre-save middleware to set recipient if not provided
chatMessageSchema.pre("save", async function (next) {
  if (!this.recipientId) {
    try {
      const { Booking } = await import("./Booking");
      const booking = await Booking.findById(this.bookingId);

      if (booking) {
        // Set recipient to the other user in the booking
        this.recipientId =
          this.senderId.toString() === booking.userId.toString()
            ? booking.providerId
            : booking.userId;
      }
    } catch (error) {
      console.error("Error setting recipient:", error);
    }
  }
  next();
});

export const ChatMessage = mongoose.model<IChatMessage, IChatMessageModel>(
  "ChatMessage",
  chatMessageSchema
);
