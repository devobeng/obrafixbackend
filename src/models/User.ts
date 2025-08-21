import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "../types";

// Mongoose schema
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters long"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters long"],
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "provider", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    profileImage: {
      type: String,
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    // Provider-specific fields
    providerProfile: {
      businessName: { type: String, trim: true },
      serviceCategory: { type: String, trim: true },
      yearsExperience: { type: Number, min: 0 },
      idVerification: {
        documentType: {
          type: String,
          enum: ["ghanaCard", "driverLicense", "passport"],
        },
        documentNumber: { type: String, trim: true },
        documentImage: { type: String, trim: true },
        isVerified: { type: Boolean, default: false },
        verifiedAt: { type: Date },
      },
      bankDetails: {
        accountNumber: { type: String, trim: true },
        accountName: { type: String, trim: true },
        bankName: { type: String, trim: true },
        isVerified: { type: Boolean, default: false },
      },
      mobileMoney: {
        provider: {
          type: String,
          enum: ["mtn", "vodafone", "airtelTigo"],
        },
        phoneNumber: { type: String, trim: true },
        isVerified: { type: Boolean, default: false },
      },
    },
    // Location permissions
    locationPermissions: {
      allowLocationAccess: { type: Boolean, default: false },
      currentLocation: {
        latitude: { type: Number },
        longitude: { type: Number },
        lastUpdated: { type: Date },
      },
    },
    // Account status
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "blocked"],
      default: "active",
    },
    suspendedReason: { type: String, trim: true },
    suspendedAt: { type: Date },
    suspendedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret: any) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ "address.city": 1, "address.state": 1 });

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(
      parseInt(process.env["BCRYPT_ROUNDS"] || "12")
    );
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-update middleware to hash password if it's being updated
userSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() as any;
  if (update.password) {
    try {
      const salt = await bcrypt.genSalt(
        parseInt(process.env["BCRYPT_ROUNDS"] || "12")
      );
      update.password = await bcrypt.hash(update.password, salt);
    } catch (error) {
      next(error as Error);
    }
  }
  next();
});

// Instance method to compare password
userSchema.methods["comparePassword"] = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this["password"]);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Static method to find user by email
userSchema.statics["findByEmail"] = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

export const User = mongoose.model<IUser, any>("User", userSchema);
export default User;
