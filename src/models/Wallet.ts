import mongoose, { Schema } from "mongoose";
import { IWallet } from "../types";

const walletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "GHS",
      enum: ["GHS", "USD"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastTransactionAt: {
      type: Date,
      default: Date.now,
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

// Indexes
// Note: userId field already has unique: true and index: true which creates an index automatically
walletSchema.index({ balance: 1 });
walletSchema.index({ lastTransactionAt: -1 });

// Static methods
walletSchema.statics["findByUser"] = function (userId: string) {
  return this.findOne({ userId, isActive: true });
};

walletSchema.statics["findActiveWallets"] = function () {
  return this.find({ isActive: true }).populate(
    "userId",
    "firstName lastName email"
  );
};

// Instance methods
walletSchema.methods["addFunds"] = function (amount: number) {
  this.balance += amount;
  this.lastTransactionAt = new Date();
  return this.save();
};

walletSchema.methods["deductFunds"] = function (amount: number) {
  if (this.balance < amount) {
    throw new Error("Insufficient funds");
  }
  this.balance -= amount;
  this.lastTransactionAt = new Date();
  return this.save();
};

walletSchema.methods["holdFunds"] = function (amount: number) {
  if (this.balance < amount) {
    throw new Error("Insufficient funds");
  }
  this.balance -= amount;
  this.lastTransactionAt = new Date();
  return this.save();
};

walletSchema.methods["releaseFunds"] = function (amount: number) {
  this.balance += amount;
  this.lastTransactionAt = new Date();
  return this.save();
};

export const Wallet = mongoose.model<IWallet, any>("Wallet", walletSchema);
export default Wallet;
