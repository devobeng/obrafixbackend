import { Request } from "express";
import { Document } from "mongoose";
import mongoose from "mongoose";

// User types
export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "user" | "provider" | "admin";
  isVerified: boolean;
  profileImage?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  // Provider-specific fields
  providerProfile?: {
    businessName?: string;
    serviceCategory?: string;
    yearsExperience?: number;
    idVerification?: {
      documentType: "ghanaCard" | "driverLicense" | "passport";
      documentNumber: string;
      documentImage: string;
      isVerified: boolean;
      verifiedAt?: Date;
    };
    bankDetails?: {
      accountNumber: string;
      accountName: string;
      bankName: string;
      isVerified: boolean;
    };
    mobileMoney?: {
      provider: "mtn" | "vodafone" | "airtelTigo";
      phoneNumber: string;
      isVerified: boolean;
    };
  };
  // Location permissions
  locationPermissions?: {
    allowLocationAccess: boolean;
    currentLocation?: {
      latitude: number;
      longitude: number;
      lastUpdated: Date;
    };
  };
  // Account status
  accountStatus: "active" | "suspended" | "blocked";
  suspendedReason?: string;
  suspendedAt?: Date;
  suspendedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// User model interface with static methods
export interface IUserModel extends Document {
  findByEmail(email: string): Promise<IUser | null>;
}

// Service types
export interface IService extends Document {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  pricing: {
    type: "hourly" | "fixed" | "negotiable";
    amount: number;
    currency: string;
    unit?: string; // "per hour", "per job", etc.
  };
  provider: string | IUser;
  location: {
    city: string;
    state: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    serviceRadius: number; // in kilometers
  };
  images: Array<{
    url: string;
    alt?: string;
  }>;
  availability: {
    isAvailable: boolean;
    workingDays: Array<{
      day:
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
        | "sunday";
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    }>;
    emergencyService: boolean;
    noticeRequired: number; // hours notice required
  };
  rating: {
    average: number;
    count: number;
    reviews: Array<{
      userId: string;
      rating: number;
      comment: string;
      createdAt: Date;
    }>;
  };
  status: "active" | "inactive" | "suspended";
  tags: string[];
  requirements: string[];
  estimatedDuration?: string;
  warranty?: string;
  commissionRate?: number; // percentage for admin
  createdAt: Date;
  updatedAt: Date;
}

// Service Category types
export interface IServiceCategory extends Document {
  _id: string;
  name: string;
  description: string;
  icon?: string;
  parentCategory?: string; // for subcategories
  commissionRate: number; // default commission rate
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Service Review types
export interface IServiceReview extends Document {
  _id: string;
  serviceId: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Booking types
export interface IBooking extends Document {
  _id: string;
  serviceId: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  providerId: mongoose.Types.ObjectId | string;
  status:
    | "pending"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "disputed";
  bookingDetails: {
    scheduledDate: Date;
    scheduledTime: string;
    duration: number; // in hours
    location: {
      address: string;
      city: string;
      state: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
    requirements: string;
    photos: Array<{
      url: string;
      alt?: string;
    }>;
    specialInstructions?: string;
  };
  pricing: {
    basePrice: number;
    additionalFees?: number;
    totalAmount: number;
    currency: string;
    paymentMethod: "mobile_money" | "bank_transfer" | "cash";
  };
  jobStatus: {
    currentStatus:
      | "pending"
      | "accepted"
      | "on_way"
      | "in_progress"
      | "completed";
    statusHistory: Array<{
      status: string;
      timestamp: Date;
      note?: string;
      updatedBy: "user" | "provider" | "admin";
    }>;
    estimatedStartTime?: Date;
    actualStartTime?: Date;
    actualEndTime?: Date;
  };
  communication: {
    messages: Array<{
      senderId: string;
      senderType: "user" | "provider";
      message: string;
      timestamp: Date;
      isRead: boolean;
    }>;
    lastMessageAt: Date;
  };
  payment: {
    status: "pending" | "authorized" | "paid" | "refunded" | "failed";
    transactionId?: string;
    paidAt?: Date;
    refundedAt?: Date;
    refundReason?: string;
  };
  cancellation?: {
    cancelledBy: "user" | "provider" | "admin";
    reason: string;
    cancelledAt: Date;
    refundAmount?: number;
  };
  dispute?: {
    isDisputed: boolean;
    disputeReason?: string;
    disputedAt?: Date;
    resolvedAt?: Date;
    resolution?: string;
    escalatedToAdmin: boolean;
  };
  rating?: {
    userRating?: number;
    userComment?: string;
    providerRating?: number;
    providerComment?: string;
    ratedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Booking Request types (for provider job requests)
export interface IBookingRequest extends Document {
  _id: string;
  bookingId: mongoose.Types.ObjectId | string;
  providerId: mongoose.Types.ObjectId | string;
  status: "pending" | "accepted" | "rejected" | "expired";
  responseTime?: Date;
  responseNote?: string;
  estimatedStartTime?: Date;
  estimatedDuration?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Job Status types
export interface IJobStatus {
  currentStatus:
    | "pending"
    | "accepted"
    | "on_way"
    | "in_progress"
    | "completed";
  statusHistory: Array<{
    status: string;
    timestamp: Date;
    note?: string;
    updatedBy: "user" | "provider" | "admin";
  }>;
  estimatedStartTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
}

// Booking Payment types
export interface IBookingPayment extends Document {
  _id: string;
  bookingId: mongoose.Types.ObjectId | string;
  amount: number;
  currency: string;
  paymentMethod: "mobile_money" | "bank_transfer" | "cash";
  status: "pending" | "authorized" | "paid" | "refunded" | "failed";
  transactionId?: string;
  paymentDetails: {
    mobileMoneyProvider?: "mtn" | "vodafone" | "airtelTigo";
    phoneNumber?: string;
    bankAccount?: string;
    bankName?: string;
  };
  paidAt?: Date;
  refundedAt?: Date;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Wallet types
export interface IWallet extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId | string;
  balance: number;
  currency: "GHS" | "USD";
  isActive: boolean;
  lastTransactionAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Wallet Transaction types
export interface IWalletTransaction extends Document {
  _id: string;
  walletId: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  type: "credit" | "debit" | "hold" | "release" | "withdrawal" | "refund";
  amount: number;
  currency: "GHS" | "USD";
  description: string;
  reference: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  metadata?: {
    bookingId?: mongoose.Types.ObjectId | string;
    paymentMethod?: string;
    transactionId?: string;
    platformFee?: number;
    commissionRate?: number;
    withdrawalMethod?: string;
    bankDetails?: {
      accountNumber?: string;
      bankName?: string;
    };
    mobileMoneyDetails?: {
      provider?: "mtn" | "vodafone" | "airtelTigo";
      phoneNumber?: string;
    };
  };
  balanceBefore: number;
  balanceAfter: number;
  processedAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Withdrawal Request types
export interface IWithdrawalRequest extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId | string;
  walletId: mongoose.Types.ObjectId | string;
  amount: number;
  currency: "GHS" | "USD";
  withdrawalMethod: "bank_transfer" | "mobile_money";
  withdrawalDetails: {
    bankDetails?: {
      accountNumber?: string;
      accountName?: string;
      bankName?: string;
    };
    mobileMoneyDetails?: {
      provider?: "mtn" | "vodafone" | "airtelTigo";
      phoneNumber?: string;
      accountName?: string;
    };
  };
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  platformFee: number;
  netAmount: number;
  reference: string;
  processedAt?: Date;
  failureReason?: string;
  adminNotes?: string;
  processedBy?: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

// Auth types
export interface IAuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: "user" | "provider";
}

export interface IAuthResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

// JWT types
export interface IJWTPayload {
  userId: string;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

// API Response types
export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Pagination types
export interface IPaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: "asc" | "desc";
}

// Search and filter types
export interface IServiceFilters {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  rating?: number;
  isActive?: boolean;
}

// Notification types
export interface INotification extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId | string;
  title: string;
  message: string;
  type:
    | "job_accepted"
    | "vendor_on_way"
    | "job_started"
    | "job_completed"
    | "job_cancelled"
    | "payment_received"
    | "withdrawal_approved"
    | "withdrawal_rejected"
    | "review_received"
    | "system_update";
  category: "booking" | "payment" | "withdrawal" | "review" | "system";
  data?: {
    bookingId?: mongoose.Types.ObjectId | string;
    serviceId?: mongoose.Types.ObjectId | string;
    amount?: number;
    status?: string;
    metadata?: any;
  };
  isRead: boolean;
  priority: "low" | "medium" | "high" | "urgent";
  scheduledAt?: Date;
  expiresAt?: Date;
  sentAt?: Date;
  deliveryStatus: "pending" | "sent" | "delivered" | "failed";
  deliveryAttempts: number;
  lastDeliveryAttempt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics types
export interface IAnalytics extends Document {
  _id: string;
  date: Date;
  period: "daily" | "weekly" | "monthly" | "yearly";
  year: number;
  month?: number;
  week?: number;
  day?: number;
  metrics: {
    totalRevenue: number;
    totalBookings: number;
    totalServices: number;
    totalUsers: number;
    totalProviders: number;
    totalAdmins: number;
    platformFees: number;
    totalWithdrawals: number;
    pendingWithdrawals: number;
    activeServices: number;
    completedBookings: number;
    cancelledBookings: number;
    disputedBookings: number;
    newRegistrations: number;
    activeUsers: number;
    totalReviews: number;
    averageRating: number;
    topServices: Array<{
      serviceId: mongoose.Types.ObjectId | string;
      serviceName: string;
      totalBookings: number;
      totalRevenue: number;
      averageRating: number;
    }>;
    topProviders: Array<{
      providerId: mongoose.Types.ObjectId | string;
      providerName: string;
      totalBookings: number;
      totalRevenue: number;
      averageRating: number;
    }>;
    topCategories: Array<{
      categoryId: mongoose.Types.ObjectId | string;
      categoryName: string;
      totalBookings: number;
      totalRevenue: number;
    }>;
  };
  categoryBreakdown: Array<{
    categoryId: mongoose.Types.ObjectId | string;
    categoryName: string;
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    totalServices: number;
  }>;
  locationBreakdown: Array<{
    city: string;
    state: string;
    totalBookings: number;
    totalRevenue: number;
    totalUsers: number;
    totalProviders: number;
  }>;
  hourlyBreakdown: Array<{
    hour: number;
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
  }>;
  dailyBreakdown: Array<{
    day: number;
    totalBookings: number;
    totalRevenue: number;
  }>;
  growthMetrics: {
    revenueGrowth?: number;
    userGrowth?: number;
    bookingGrowth?: number;
    serviceGrowth?: number;
  };
  comparisonData: {
    previousPeriod: {
      startDate: Date;
      endDate: Date;
      totalRevenue: number;
      totalBookings: number;
      totalUsers: number;
    };
    currentPeriod: {
      startDate: Date;
      endDate: Date;
      totalRevenue: number;
      totalBookings: number;
      totalUsers: number;
    };
  };
  lastUpdated: Date;
  isProcessed: boolean;
  processingNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Chat types
export interface IChatMessage {
  _id: string;
  bookingId: string;
  senderId: string;
  recipientId?: string;
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

// Vendor Review types
export interface IVendorReview {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatConversation {
  bookingId: string;
  booking: {
    id: string;
    status: string;
    service: any;
    customer: any;
    provider: any;
    scheduledDate: Date;
    updatedAt: Date;
  };
  lastMessage: {
    id: string;
    message: string;
    messageType: string;
    sender: any;
    timestamp: Date;
  } | null;
  unreadCount: number;
}

export interface IChatRequest {
  bookingId: string;
  message: string;
  messageType?: "text" | "image" | "file" | "location";
  metadata?: any;
}

// Error types
export interface IAppError extends Error {
  statusCode: number;
  isOperational: boolean;
}
