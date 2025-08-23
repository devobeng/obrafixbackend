import { ChatService } from "./ChatService";
import { NotificationService } from "./NotificationService";
import { Booking } from "../models/Booking";
import { User } from "../models/User";
import { Service } from "../models/Service";
import { ChatMessage } from "../models/ChatMessage";
import { Notification } from "../models/Notification";
import { AppError } from "../utils/AppError";
import { SocketServer } from "../socket/socketServer";

export interface ProviderChatStats {
  totalConversations: number;
  activeConversations: number;
  unreadMessages: number;
  averageResponseTime: number;
  responseRate: number;
  recentMessages: any[];
}

export interface ProviderNotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  recentNotifications: any[];
}

export interface SupportTicket {
  id: string;
  providerId: string;
  category: string;
  subject: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  adminResponse?: string;
}

export interface CustomerReport {
  id: string;
  providerId: string;
  customerId: string;
  bookingId?: string;
  reason: string;
  description: string;
  evidence: string[];
  status: "pending" | "investigating" | "resolved" | "dismissed";
  severity: "low" | "medium" | "high" | "critical";
  createdAt: Date;
  updatedAt: Date;
  adminNotes?: string;
  resolution?: string;
}

export class ProviderCommunicationService {
  private chatService: ChatService;
  private notificationService: NotificationService;
  private socketServer: SocketServer;

  constructor(
    chatService: ChatService,
    notificationService: NotificationService,
    socketServer: SocketServer
  ) {
    this.chatService = chatService;
    this.notificationService = notificationService;
    this.socketServer = socketServer;
  }

  // ==================== CHAT MANAGEMENT ====================

  // Get provider chat statistics
  async getProviderChatStats(providerId: string): Promise<ProviderChatStats> {
    try {
      // Get all bookings for this provider
      const bookings = await Booking.find({ providerId }).select("_id");
      const bookingIds = bookings.map((booking) => booking._id);

      // Get total conversations
      const totalConversations = bookingIds.length;

      // Get active conversations (with recent messages in last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const activeBookings = await ChatMessage.aggregate([
        {
          $match: {
            bookingId: { $in: bookingIds },
            timestamp: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: "$bookingId",
            lastMessage: { $max: "$timestamp" },
          },
        },
      ]);
      const activeConversations = activeBookings.length;

      // Get unread messages count
      const unreadMessages = await ChatMessage.countDocuments({
        bookingId: { $in: bookingIds },
        senderId: { $ne: providerId },
        isRead: false,
      });

      // Calculate average response time
      const responseTimeData = await ChatMessage.aggregate([
        {
          $match: {
            bookingId: { $in: bookingIds },
            senderId: { $ne: providerId },
          },
        },
        {
          $lookup: {
            from: "chatmessages",
            let: { bookingId: "$bookingId", timestamp: "$timestamp" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$bookingId", "$$bookingId"] },
                      { $gt: ["$timestamp", "$$timestamp"] },
                      { $eq: ["$senderId", providerId] },
                    ],
                  },
                },
              },
              {
                $limit: 1,
              },
            ],
            as: "response",
          },
        },
        {
          $match: {
            response: { $ne: [] },
          },
        },
        {
          $addFields: {
            responseTime: {
              $divide: [
                {
                  $subtract: [
                    { $arrayElemAt: ["$response.timestamp", 0] },
                    "$timestamp",
                  ],
                },
                1000 * 60, // Convert to minutes
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            averageResponseTime: { $avg: "$responseTime" },
          },
        },
      ]);

      const averageResponseTime = responseTimeData[0]?.averageResponseTime || 0;

      // Calculate response rate (percentage of customer messages that got a response)
      const customerMessages = await ChatMessage.countDocuments({
        bookingId: { $in: bookingIds },
        senderId: { $ne: providerId },
      });

      const respondedMessages = await ChatMessage.aggregate([
        {
          $match: {
            bookingId: { $in: bookingIds },
            senderId: { $ne: providerId },
          },
        },
        {
          $lookup: {
            from: "chatmessages",
            let: { bookingId: "$bookingId", timestamp: "$timestamp" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$bookingId", "$$bookingId"] },
                      { $gt: ["$timestamp", "$$timestamp"] },
                      { $eq: ["$senderId", providerId] },
                    ],
                  },
                },
              },
              {
                $limit: 1,
              },
            ],
            as: "response",
          },
        },
        {
          $match: {
            response: { $ne: [] },
          },
        },
        {
          $count: "count",
        },
      ]);

      const responseRate =
        customerMessages > 0
          ? ((respondedMessages[0]?.count || 0) / customerMessages) * 100
          : 0;

      // Get recent messages
      const recentMessages = await ChatMessage.find({
        bookingId: { $in: bookingIds },
      })
        .populate("senderId", "firstName lastName profileImage")
        .populate("bookingId", "serviceId scheduledDate")
        .sort({ timestamp: -1 })
        .limit(10);

      return {
        totalConversations,
        activeConversations,
        unreadMessages,
        averageResponseTime: Math.round(averageResponseTime * 100) / 100,
        responseRate: Math.round(responseRate * 100) / 100,
        recentMessages,
      };
    } catch (error) {
      throw new AppError("Failed to get provider chat statistics", 500);
    }
  }

  // Get provider conversations with customers
  async getProviderConversations(
    providerId: string,
    options: {
      page?: number;
      limit?: number;
      status?: "active" | "completed" | "all";
      search?: string;
    } = {}
  ): Promise<{ conversations: any[]; pagination: any }> {
    try {
      const { page = 1, limit = 20, status = "all", search } = options;
      const skip = (page - 1) * limit;

      // Get bookings for this provider
      let bookingQuery: any = { providerId };

      if (status === "active") {
        bookingQuery.status = { $in: ["accepted", "on_way", "in_progress"] };
      } else if (status === "completed") {
        bookingQuery.status = { $in: ["completed", "cancelled"] };
      }

      if (search) {
        bookingQuery.$or = [
          { "serviceId.title": { $regex: search, $options: "i" } },
          { "userId.firstName": { $regex: search, $options: "i" } },
          { "userId.lastName": { $regex: search, $options: "i" } },
        ];
      }

      const bookings = await Booking.find(bookingQuery)
        .populate("userId", "firstName lastName email profileImage phone")
        .populate("serviceId", "title category")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);

      // Get conversation data for each booking
      const conversations = await Promise.all(
        bookings.map(async (booking: any) => {
          const lastMessage = await ChatMessage.findOne({
            bookingId: booking._id,
          })
            .sort({ timestamp: -1 })
            .populate("senderId", "firstName lastName profileImage");

          const unreadCount = await ChatMessage.countDocuments({
            bookingId: booking._id,
            senderId: { $ne: providerId },
            isRead: false,
          });

          return {
            bookingId: booking._id,
            customer: booking.userId,
            service: booking.serviceId,
            status: booking.status,
            scheduledDate: booking.scheduledDate,
            lastMessage: lastMessage
              ? {
                  id: lastMessage._id,
                  message: lastMessage.message,
                  messageType: lastMessage.messageType,
                  sender: lastMessage.senderId,
                  timestamp: lastMessage.timestamp,
                  isRead: lastMessage.isRead,
                }
              : null,
            unreadCount,
            updatedAt: booking.updatedAt,
          };
        })
      );

      const total = await Booking.countDocuments(bookingQuery);
      const totalPages = Math.ceil(total / limit);

      return {
        conversations,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new AppError("Failed to get provider conversations", 500);
    }
  }

  // Send quick response templates
  async sendQuickResponse(
    bookingId: string,
    providerId: string,
    templateType: "greeting" | "on_way" | "arrived" | "completed" | "custom",
    customMessage?: string
  ): Promise<any> {
    try {
      const templates = {
        greeting:
          "Hello! I'm on my way to provide your service. I'll be there shortly.",
        on_way:
          "I'm on my way to your location. I'll arrive in about 10-15 minutes.",
        arrived:
          "I've arrived at your location. Please let me know where you'd like me to start.",
        completed:
          "The service has been completed. Thank you for choosing our service!",
        custom: customMessage || "Thank you for your message.",
      };

      const message = templates[templateType];
      return await this.chatService.sendMessage(
        bookingId,
        providerId,
        message,
        "text"
      );
    } catch (error) {
      throw new AppError("Failed to send quick response", 500);
    }
  }

  // ==================== NOTIFICATION MANAGEMENT ====================

  // Get provider notification statistics
  async getProviderNotificationStats(
    providerId: string
  ): Promise<ProviderNotificationStats> {
    try {
      const stats = await this.notificationService.getUserNotificationStats(
        providerId
      );

      // Get recent notifications
      const recentNotifications = await Notification.find({
        userId: providerId,
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("data.bookingId", "serviceId scheduledDate");

      return {
        ...stats,
        recentNotifications,
      };
    } catch (error) {
      throw new AppError("Failed to get provider notification statistics", 500);
    }
  }

  // Get provider notifications by category
  async getProviderNotificationsByCategory(
    providerId: string,
    category: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
    } = {}
  ): Promise<{ notifications: any[]; pagination: any }> {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = options;
      const skip = (page - 1) * limit;

      const query: any = { userId: providerId, category };
      if (unreadOnly) query.isRead = false;

      const [notifications, total] = await Promise.all([
        Notification.find(query)
          .populate("data.bookingId", "serviceId scheduledDate")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Notification.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new AppError(
        "Failed to get provider notifications by category",
        500
      );
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(
    providerId: string,
    preferences: {
      newBookings?: boolean;
      messages?: boolean;
      payments?: boolean;
      reviews?: boolean;
      system?: boolean;
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    }
  ): Promise<void> {
    try {
      await User.findByIdAndUpdate(providerId, {
        $set: { notificationPreferences: preferences },
      });
    } catch (error) {
      throw new AppError("Failed to update notification preferences", 500);
    }
  }

  // ==================== SUPPORT SYSTEM ====================

  // Create support ticket
  async createSupportTicket(
    providerId: string,
    ticketData: {
      category: string;
      subject: string;
      description: string;
      priority: "low" | "medium" | "high" | "urgent";
      attachments?: string[];
    }
  ): Promise<SupportTicket> {
    try {
      // Create support ticket model (you'll need to create this)
      const SupportTicketModel = require("../models/SupportTicket");

      const ticket = new SupportTicketModel({
        providerId,
        category: ticketData.category,
        subject: ticketData.subject,
        description: ticketData.description,
        priority: ticketData.priority,
        attachments: ticketData.attachments || [],
        status: "open",
      });

      await ticket.save();

      // Send notification to admin
      await this.notificationService.createNotification({
        userId: "admin", // You'll need to get admin user ID
        title: "New Support Ticket",
        message: `Provider ${providerId} has created a new support ticket: ${ticketData.subject}`,
        type: "support_ticket",
        category: "support",
        priority: ticketData.priority === "urgent" ? "high" : "medium",
        data: {
          ticketId: ticket._id,
          providerId,
          category: ticketData.category,
          priority: ticketData.priority,
        },
      });

      return ticket;
    } catch (error) {
      throw new AppError("Failed to create support ticket", 500);
    }
  }

  // Get provider support tickets
  async getProviderSupportTickets(
    providerId: string,
    options: {
      page?: number;
      limit?: number;
      status?: "open" | "in_progress" | "resolved" | "closed" | "all";
    } = {}
  ): Promise<{ tickets: SupportTicket[]; pagination: any }> {
    try {
      const { page = 1, limit = 20, status = "all" } = options;
      const skip = (page - 1) * limit;

      const SupportTicketModel = require("../models/SupportTicket");

      const query: any = { providerId };
      if (status !== "all") query.status = status;

      const [tickets, total] = await Promise.all([
        SupportTicketModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        SupportTicketModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        tickets,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new AppError("Failed to get provider support tickets", 500);
    }
  }

  // ==================== CUSTOMER REPORTING ====================

  // Report fraudulent or abusive customer
  async reportCustomer(
    providerId: string,
    reportData: {
      customerId: string;
      bookingId?: string;
      reason: string;
      description: string;
      evidence?: string[];
      severity: "low" | "medium" | "high" | "critical";
    }
  ): Promise<CustomerReport> {
    try {
      // Create customer report model (you'll need to create this)
      const CustomerReportModel = require("../models/CustomerReport");

      const report = new CustomerReportModel({
        providerId,
        customerId: reportData.customerId,
        bookingId: reportData.bookingId,
        reason: reportData.reason,
        description: reportData.description,
        evidence: reportData.evidence || [],
        severity: reportData.severity,
        status: "pending",
      });

      await report.save();

      // Send notification to admin
      await this.notificationService.createNotification({
        userId: "admin", // You'll need to get admin user ID
        title: "Customer Report Filed",
        message: `Provider ${providerId} has reported customer ${reportData.customerId} for ${reportData.reason}`,
        type: "customer_report",
        category: "support",
        priority: reportData.severity === "critical" ? "high" : "medium",
        data: {
          reportId: report._id,
          providerId,
          customerId: reportData.customerId,
          reason: reportData.reason,
          severity: reportData.severity,
        },
      });

      return report;
    } catch (error) {
      throw new AppError("Failed to report customer", 500);
    }
  }

  // Get provider customer reports
  async getProviderCustomerReports(
    providerId: string,
    options: {
      page?: number;
      limit?: number;
      status?: "pending" | "investigating" | "resolved" | "dismissed" | "all";
    } = {}
  ): Promise<{ reports: CustomerReport[]; pagination: any }> {
    try {
      const { page = 1, limit = 20, status = "all" } = options;
      const skip = (page - 1) * limit;

      const CustomerReportModel = require("../models/CustomerReport");

      const query: any = { providerId };
      if (status !== "all") query.status = status;

      const [reports, total] = await Promise.all([
        CustomerReportModel.find(query)
          .populate("customerId", "firstName lastName email")
          .populate("bookingId", "serviceId scheduledDate")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        CustomerReportModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        reports,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new AppError("Failed to get provider customer reports", 500);
    }
  }

  // ==================== HELP CENTER ====================

  // Get help center categories
  async getHelpCenterCategories(): Promise<any[]> {
    try {
      // This would typically come from a database or CMS
      return [
        {
          id: "getting-started",
          title: "Getting Started",
          description: "Learn how to get started as a provider",
          icon: "🚀",
          articles: [
            {
              id: "how-to-signup",
              title: "How to Sign Up as a Provider",
              description: "Step-by-step guide to becoming a provider",
            },
            {
              id: "profile-setup",
              title: "Setting Up Your Profile",
              description: "How to create an attractive provider profile",
            },
          ],
        },
        {
          id: "bookings",
          title: "Managing Bookings",
          description: "Everything about managing your bookings",
          icon: "📅",
          articles: [
            {
              id: "accepting-bookings",
              title: "Accepting and Managing Bookings",
              description: "How to handle incoming booking requests",
            },
            {
              id: "job-status-updates",
              title: "Updating Job Status",
              description: "How to update customers on job progress",
            },
          ],
        },
        {
          id: "payments",
          title: "Payments & Earnings",
          description: "Understanding payments and withdrawals",
          icon: "💰",
          articles: [
            {
              id: "payment-process",
              title: "How Payments Work",
              description: "Understanding the payment process",
            },
            {
              id: "withdrawals",
              title: "Withdrawing Your Earnings",
              description: "How to withdraw your earnings",
            },
          ],
        },
        {
          id: "communication",
          title: "Communication",
          description: "Chat and communication with customers",
          icon: "💬",
          articles: [
            {
              id: "chat-features",
              title: "Chat Features",
              description: "Using the in-app chat system",
            },
            {
              id: "quick-responses",
              title: "Quick Response Templates",
              description: "Using pre-written response templates",
            },
          ],
        },
        {
          id: "support",
          title: "Support & Issues",
          description: "Getting help and reporting issues",
          icon: "🆘",
          articles: [
            {
              id: "contact-support",
              title: "Contacting Support",
              description: "How to get help when you need it",
            },
            {
              id: "reporting-issues",
              title: "Reporting Issues",
              description: "How to report problems or abusive customers",
            },
          ],
        },
      ];
    } catch (error) {
      throw new AppError("Failed to get help center categories", 500);
    }
  }

  // Get help center article
  async getHelpCenterArticle(articleId: string): Promise<any> {
    try {
      // This would typically come from a database or CMS
      const articles: { [key: string]: any } = {
        "how-to-signup": {
          id: "how-to-signup",
          title: "How to Sign Up as a Provider",
          content: `
            <h2>Getting Started as a Provider</h2>
            <p>Follow these steps to become a provider on our platform:</p>
            <ol>
              <li>Download the app and create an account</li>
              <li>Select "Become a Provider" during registration</li>
              <li>Complete your profile with personal information</li>
              <li>Add your services and pricing</li>
              <li>Upload required documents for verification</li>
              <li>Wait for approval (usually 1-3 business days)</li>
            </ol>
            <h3>Required Documents</h3>
            <ul>
              <li>Valid government ID</li>
              <li>Proof of address</li>
              <li>Professional certifications (if applicable)</li>
              <li>Insurance documents (if applicable)</li>
            </ul>
          `,
          category: "getting-started",
          tags: ["signup", "registration", "verification"],
        },
        "accepting-bookings": {
          id: "accepting-bookings",
          title: "Accepting and Managing Bookings",
          content: `
            <h2>Managing Your Bookings</h2>
            <p>Here's how to effectively manage incoming booking requests:</p>
            <h3>Receiving Booking Requests</h3>
            <ul>
              <li>You'll receive notifications for new booking requests</li>
              <li>Review the job details, location, and customer information</li>
              <li>Check your availability for the requested time</li>
              <li>Accept or decline within the specified time limit</li>
            </ul>
            <h3>After Accepting a Booking</h3>
            <ul>
              <li>Contact the customer to confirm details</li>
              <li>Update job status as you progress</li>
              <li>Communicate any delays or issues</li>
              <li>Complete the job and mark as finished</li>
            </ul>
          `,
          category: "bookings",
          tags: ["bookings", "management", "customer-service"],
        },
      };

      const article = articles[articleId];
      if (!article) {
        throw new AppError("Article not found", 404);
      }

      return article;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to get help center article", 500);
    }
  }

  // Search help center
  async searchHelpCenter(query: string): Promise<any[]> {
    try {
      // This would typically use a search engine or database search
      const allArticles = [
        {
          id: "how-to-signup",
          title: "How to Sign Up as a Provider",
          category: "getting-started",
          excerpt:
            "Step-by-step guide to becoming a provider on our platform...",
        },
        {
          id: "accepting-bookings",
          title: "Accepting and Managing Bookings",
          category: "bookings",
          excerpt:
            "Learn how to effectively manage incoming booking requests...",
        },
      ];

      const searchResults = allArticles.filter(
        (article) =>
          article.title.toLowerCase().includes(query.toLowerCase()) ||
          article.excerpt.toLowerCase().includes(query.toLowerCase())
      );

      return searchResults;
    } catch (error) {
      throw new AppError("Failed to search help center", 500);
    }
  }
}
